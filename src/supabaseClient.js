// src/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("full_name, role, is_active")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error);
    throw error;
  }

  return data || null;
}

export async function uploadReferenceFile(file, userId) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("reference-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("reference-files")
    .getPublicUrl(uploadData.path);

  return publicUrlData.publicUrl;
}

export async function uploadDesignAsset(file, requestId, userId) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${requestId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("design-assets")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("design-assets")
    .getPublicUrl(uploadData.path);

  return publicUrlData.publicUrl;
}

// FUNGSI BARU: Mengambil ID pengguna yang berhak menyetujui (PRODUCER/MGMT/ADMIN)
export async function fetchApproverRecipients() {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .in("role", ["PRODUCER", "MANAGEMENT", "ADMIN"])
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching approver recipients:", error);
    return [];
  }
  return data.map((user) => user.id);
}

// FUNGSI BARU: Mencatat notifikasi ke tabel 'notifications' (UC-15 Helper)
export async function sendNotification(requestId, eventType, message, userIds) {
  if (!userIds || userIds.length === 0) {
    console.warn("sendNotification: No recipients specified.");
    return;
  }

  const notificationsToInsert = userIds.map((userId) => ({
    user_id: userId,
    request_id: requestId,
    event_type: eventType,
    message: message,
  }));

  const { error } = await supabase
    .from("notifications")
    .insert(notificationsToInsert);

  if (error) {
    console.error("Error sending notification:", error);
    return false;
  }
  return true;
}

export async function createRequest(requestData, requesterId) {
  const { title, description, category, deadline, reference_url } = requestData;

  const { data, error } = await supabase
    .from("requests")
    .insert({
      requester_id: requesterId,
      title,
      description,
      category,
      deadline,
      reference_url,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // >>> LOGIKA NOTIFIKASI: Permintaan Dibuat (UC-15) <<<
  const approverIds = await fetchApproverRecipients();
  const message = `Permintaan baru [${data.category}] "${data.title}" telah dibuat dan menunggu persetujuan.`;

  if (approverIds.length > 0) {
    await sendNotification(
      data.request_id,
      "REQUEST_CREATED",
      message,
      approverIds
    );
  }
  // >>> AKHIR LOGIKA NOTIFIKASI <<<

  return data;
}

export async function fetchMyRequests(userId) {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      *,
      designer:users!designer_id(full_name)
    `
    )
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

export async function updateRequest(requestId, updates) {
  const { data, error } = await supabase
    .from("requests")
    .update(updates)
    .eq("request_id", requestId)
    .select(
      `
      *, 
      requester:users!requester_id(id), 
      designer:users!designer_id(id)
      `
    )
    .single();

  if (error) {
    throw error;
  }

  const newStatus = updates.status;
  const requesterId = data.requester.id;
  const designerId = data.designer?.id;

  const recipients = [];
  let message = "";
  let eventType = "";

  if (newStatus === "Approved") {
    recipients.push(requesterId);
    if (designerId) recipients.push(designerId);
    message = `Permintaan "${data.title}" telah disetujui dan ditugaskan.`;
    eventType = "REQUEST_APPROVED";
  } else if (newStatus === "Rejected") {
    recipients.push(requesterId);
    message = `Permintaan "${data.title}" ditolak (Rejected) dan dikembalikan untuk revisi brief.`;
    eventType = "REVISION_BRIEF";
  } else if (newStatus === "Canceled") {
    recipients.push(requesterId);
    if (designerId) recipients.push(designerId);
    message = `Permintaan "${data.title}" telah dibatalkan.`;
    eventType = "REQUEST_CANCELED";
  }

  if (recipients.length > 0) {
    await sendNotification(data.request_id, eventType, message, recipients);
  }
  // --- AKHIR LOGIKA NOTIFIKASI ---

  return data;
}

// --------------------------------------------------------------------------------
// FUNGSI UNTUK REVIEW/FEEDBACK/COMPLETE (UC-08 & UC-10)
// --------------------------------------------------------------------------------
export async function submitReviewAndChangeStatus(
  requestId,
  commenterId,
  versionNo, // Versi desain yang sedang di-review
  feedbackText, // Catatan (bisa kosong untuk Complete)
  newStatus // Status baru: "Revision" atau "Completed"
) {
  // 1. Catat feedback ke tabel 'feedback' HANYA JIKA ada teks komentar
  if (feedbackText && feedbackText.trim() !== "") {
    const { error: feedbackError } = await supabase.from("feedback").insert({
      request_id: requestId,
      version_no: versionNo,
      commenter_id: commenterId,
      feedback_text: feedbackText.trim(),
      status_change: newStatus, // Mencatat outcome review (Revision/Completed)
    });

    if (feedbackError) {
      console.error("Error saving feedback:", feedbackError);
      throw new Error("Gagal menyimpan umpan balik.");
    }
  }

  // 2. Perbarui status permintaan di tabel 'requests'
  const updates = { status: newStatus };

  const { data, error: updateError } = await supabase
    .from("requests")
    .update(updates)
    .eq("request_id", requestId)
    .select(
      `
      *, 
      requester:users!requester_id(id), 
      designer:users!designer_id(id)
      `
    )
    .single();

  if (updateError) {
    console.error("Error updating request status:", updateError);
    throw new Error(
      `Gagal memperbarui status permintaan menjadi ${newStatus}.`
    );
  }

  // --- LOGIKA NOTIFIKASI ---
  const requesterId = data.requester.id;
  const designerId = data.designer.id;

  const recipients = [requesterId, designerId];
  let message = "";
  let eventType = "";

  if (newStatus === "Revision") {
    recipients.splice(recipients.indexOf(requesterId), 1); // Notif hanya ke Designer
    message = `Desain V${versionNo} untuk "${data.title}" perlu direvisi. Cek feedback.`;
    eventType = "REVISION_DESIGN";
  } else if (newStatus === "Completed") {
    message = `Permintaan "${data.title}" berhasil Diselesaikan (Completed).`;
    eventType = "COMPLETED";
  }

  if (recipients.length > 0) {
    await sendNotification(data.request_id, eventType, message, recipients);
  }
  // --- AKHIR LOGIKA NOTIFIKASI ---

  const finalDesignUrl = data.latest_design_url;
  if (newStatus === "Completed" && finalDesignUrl) {
    await archiveDesign(data.request_id, finalDesignUrl);
  }

  return data;
}
// --------------------------------------------------------------------------------
// FUNGSI SIMULASI UC-12: Save QC Report
export async function saveQCReport(reportData) {
  // Simulates saving a QC report based on AI findings (OCR/NLP/CV)
  const { error } = await supabase.from("qc_reports").insert(reportData);

  if (error) {
    console.error("Error saving QC Report:", error);
    // Asumsi: Error ini ditoleransi agar alur utama tidak terhenti jika tabel belum ada.
  }
  return true;
}

export async function archiveDesign(requestId, finalDesignUrl) {
  const { error } = await supabase.from("archive").insert({
    request_id: requestId,
    archive_url: finalDesignUrl,
  });

  if (error) {
    console.error("Error archiving design:", error);
  }
  return true;
}

export async function fetchDesigners() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "DESIGNER");

  if (error) {
    throw error;
  }
  return data;
}

// --------------------------------------------------------------------------------
// FUNGSI MODIFIKASI UC-11: Fetch Dashboard Data dengan Filter
// --------------------------------------------------------------------------------
export async function fetchDashboardData(filters = {}) {
  let query = supabase
    .from("requests")
    .select(
      "request_id, title, category, deadline, status, designer_id, designers:users!designer_id(full_name)"
    )
    .order("created_at", { ascending: false });

  // Implementasi filter sederhana (FR-15)
  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }

  if (filters.designerId) {
    query = query.eq("designer_id", filters.designerId);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
}
// --------------------------------------------------------------------------------
// FUNGSI BARU UC-11: Fetch Revision Counts untuk Analisis
// --------------------------------------------------------------------------------
export async function fetchRevisionCounts(filters = {}) {
  let query = supabase
    .from("feedback")
    .select("request_id")
    .eq("status_change", "Revision");

  // Filter di sini bisa ditambahkan berdasarkan filter waktu jika diperlukan
  // Untuk saat ini, kita hanya fokus pada status 'Revision'

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
}
// --------------------------------------------------------------------------------

export async function fetchRequestsForApproval() {
  const approvalStatuses = ["Submitted"];

  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      request_id, 
      title, 
      category, 
      deadline, 
      status, 
      description,
      reference_url,
      requester_info:users!requester_id ( 
          full_name
      )
    `
    )
    .in("status", approvalStatuses)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data;
}

export async function fetchMyTasks(designerId) {
  const activeStatuses = ["Approved", "In Progress", "Revision", "Completed"];

  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      request_id, 
      title, 
      category, 
      deadline, 
      status, 
      version_no,  
      requester:users!requester_id(full_name),
      reference_url 
    `
    )
    .eq("designer_id", designerId)
    .in("status", activeStatuses)
    .order("deadline", { ascending: true });

  if (error) {
    throw error;
  }
  return data;
}

export async function fetchActiveRequestsForTable() {
  const activeStatuses = [
    "Submitted",
    "Approved",
    "In Progress",
    "For Review",
    "Revision",
  ];

  const { data, error } = await supabase
    .from("requests")
    .select(
      `
            request_id, 
            title, 
            category, 
            deadline, 
            status, 
            designer:users!designer_id ( 
                full_name
            )
        `
    )
    .in("status", activeStatuses)
    .order("deadline", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching active requests for table:", error);
    throw error;
  }
  return data;
}

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
  return data;
}

export async function updateUserRoleAndStatus(
  userId,
  newRole,
  isActive,
  changerId // ARGUMEN BARU UNTUK AUDIT
) {
  const updates = {
    role: newRole,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const { data: oldUser } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  const { data: updatedUser, error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating user role/status:", updateError);
    throw updateError;
  }

  let actionType = "USER_UPDATE";
  let description = `Pengguna ${updatedUser.full_name} diperbarui.`;

  if (oldUser.is_active && !isActive) {
    actionType = "DEACTIVATION";
    description = `Pengguna ${updatedUser.full_name} dinonaktifkan.`;
  } else if (!oldUser.is_active && isActive) {
    actionType = "REACTIVATION";
    description = `Pengguna ${updatedUser.full_name} diaktifkan kembali.`;
  } else if (oldUser.role !== newRole) {
    actionType = "ROLE_CHANGE";
    description = `Peran pengguna ${updatedUser.full_name} diubah dari ${oldUser.role} menjadi ${newRole}.`;
  }

  const { error: logError } = await supabase.from("audit_logs").insert({
    changer_id: changerId,
    target_user_id: userId,
    action_type: actionType,
    old_value: oldUser, // Catat nilai lama
    new_value: { role: updatedUser.role, is_active: updatedUser.is_active }, // Catat nilai baru
    description: description,
  });

  if (logError) {
    console.warn("Gagal mencatat audit log:", logError);
  }

  return updatedUser;
}

export async function fetchAuditLogs() {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      `
      timestamp,
      action_type,
      description,
      old_value,
      new_value,
      changer:changer_id(full_name),
      target_user:target_user_id(full_name)
      `
    )
    .order("timestamp", { ascending: false }); // Urutkan dari yang terbaru

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
  return data;
}

export async function createNewUserByAdmin(email, password, fullName, role) {
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    method: "POST",
    body: { email, password, fullName, role },
  });

  if (error) {
    throw new Error(`Panggilan Edge Function gagal: ${error.message}`);
  }

  if (data.error) {
    throw new Error(
      data.error.message || "Gagal membuat pengguna melalui server."
    );
  }

  return data.user;
}

export async function fetchUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
  return count;
}

export async function fetchRecentNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id, 
      message, 
      sent_at, 
      read_at,
      event_type,
      request_id,
      requests (title)
    `
    )
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(50); // Batasan untuk menampilkan riwayat

  if (error) {
    throw error;
  }
  return data;
}

export async function markNotificationsAsRead(userId, notificationIds) {
  // Tipe event yang bersifat shared responsibility (untuk Approver/Admin)
  const SHARED_EVENTS = ["REQUEST_CREATED", "REQUEST_APPROVED"];

  // Jika hanya satu ID yang ditandai, cek apakah itu event bersama
  if (notificationIds.length === 1) {
    const notifId = notificationIds[0];
    const { data: notifData, error: fetchError } = await supabase
      .from("notifications")
      .select("request_id, event_type")
      .eq("id", notifId)
      .single();

    if (
      !fetchError &&
      notifData &&
      SHARED_EVENTS.includes(notifData.event_type)
    ) {
      // 1. Dapatkan semua notifikasi terkait event ini yang belum dibaca
      const { data: allRelatedUnread, error: relatedError } = await supabase
        .from("notifications")
        .select("id")
        .eq("request_id", notifData.request_id)
        .eq("event_type", notifData.event_type)
        .is("read_at", null)
        .in("user_id", await fetchApproverRecipients()); // Hanya berlaku untuk Approver/Admin

      if (relatedError)
        throw new Error("Gagal mengidentifikasi notifikasi terkait.");

      const allIdsToMark = allRelatedUnread.map((n) => n.id);

      // 2. Tandai SEMUA notifikasi terkait sebagai sudah dibaca (Group Read)
      const { error: groupUpdateError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", allIdsToMark);

      if (groupUpdateError) throw groupUpdateError;
      return true;
    }
  }

  // Fallback untuk notifikasi personal (atau jika 'Mark All' dijalankan)
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", notificationIds)
    .eq("user_id", userId); // Pastikan hanya pengguna sendiri yang dapat menandai

  if (error) {
    throw error;
  }
  return true;
}

// --------------------------------------------------------------------
// >>> FUNGSI BARU UNTUK BADGE SIDEBAR <<<
// --------------------------------------------------------------------

// 1. Menghitung Request yang Menunggu Persetujuan (Daftar Persetujuan)
export async function fetchSubmittedRequestCount() {
  const { count, error } = await supabase
    .from("requests")
    .select("request_id", { count: "exact", head: true })
    .eq("status", "Submitted");

  if (error) {
    console.error("Error fetching submitted count:", error);
    return 0;
  }
  return count;
}

// 2. Menghitung Tugas Aktif untuk Designer (Tugas Saya)
export async function fetchMyTaskCount(userId) {
  const activeStatuses = ["Approved", "Revision"];

  const { count, error } = await supabase
    .from("requests")
    .select("request_id", { count: "exact", head: true })
    .eq("designer_id", userId)
    .in("status", activeStatuses);

  if (error) {
    console.error("Error fetching my task count:", error);
    return 0;
  }
  return count;
}

// 3. Menghitung Request yang Menunggu Review dari Requester (Daftar Permintaan Saya)
export async function fetchMyReviewCount(userId) {
  const reviewStatus = "For Review";

  const { count, error } = await supabase
    .from("requests")
    .select("request_id", { count: "exact", head: true })
    .eq("requester_id", userId)
    .eq("status", reviewStatus);

  if (error) {
    console.error("Error fetching my review count:", error);
    return 0;
  }
  return count;
}
