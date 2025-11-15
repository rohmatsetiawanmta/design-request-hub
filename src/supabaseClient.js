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
  return data;
}

export async function fetchMyRequests(userId) {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
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
    .select()
    .single();

  if (error) {
    throw error;
  }
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
    .select()
    .single();

  if (updateError) {
    console.error("Error updating request status:", updateError);
    throw new Error(
      `Gagal memperbarui status permintaan menjadi ${newStatus}.`
    );
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

// FUNGSI SIMULASI UC-14: Archive Final Design
export async function archiveDesign(requestId, finalDesignUrl) {
  // Simulates the archiving process (UC-14) after completion
  const { error } = await supabase.from("archive").insert({
    request_id: requestId,
    archive_url: finalDesignUrl, // Store final public URL
  });

  if (error) {
    console.error("Error archiving design:", error);
    // Asumsi: Error ini ditoleransi agar alur utama tidak terhenti jika tabel belum ada.
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
  const activeStatuses = ["Approved", "In Progress", "Revision"];

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
  console.log(data);

  if (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
  return data;
}

export async function updateUserRoleAndStatus(userId, newRole, isActive) {
  const updates = {
    role: newRole,
    is_active: isActive,
    // Asumsi ada kolom updated_at di tabel users untuk tujuan audit
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user role/status:", error);
    throw error;
  }
  return data;
}
