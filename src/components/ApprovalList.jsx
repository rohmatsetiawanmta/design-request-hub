import React, { useState, useEffect } from "react";
import {
  fetchRequestsForApproval,
  updateRequest,
  fetchDesigners,
} from "../supabaseClient";
import { Check, X, Eye, UserCheck } from "lucide-react";
import RequestPreviewModal from "./RequestPreviewModal";
import AssignDesignerModal from "./AssignDesignerModal"; // <-- Import Komponen yang Dipisah

const getStatusColor = (status) => {
  switch (status) {
    case "Submitted":
      return "bg-yellow-100 text-yellow-800";
    case "Approved":
    case "In Progress":
      return "bg-purple-100 text-purple-800";
    case "For Review":
      return "bg-blue-100 text-blue-800";
    case "Revision":
      return "bg-red-100 text-red-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ApprovalList = () => {
  const [requests, setRequests] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequestToPreview, setSelectedRequestToPreview] =
    useState(null);
  const [requestToAssign, setRequestToAssign] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequestsForApproval();
      const designerData = await fetchDesigners();

      setRequests(data);
      setDesigners(designerData);
    } catch (err) {
      console.error("Gagal memuat permintaan persetujuan:", err);
      setError(
        "Gagal memuat daftar permintaan persetujuan. Pastikan konfigurasi database."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // --- FUNGSI UC-06: Menangani Penugasan Final (Logika Inti Tetap di Parent) ---
  const handleAssignment = async (requestId, designerId) => {
    setProcessingId(requestId);
    setRequestToAssign(null);

    try {
      // 1. Update status menjadi Approved & designer_id (FR-05, FR-06)
      await updateRequest(requestId, {
        status: "Approved",
        designer_id: designerId,
      });

      // 2. Notifikasi (FR-16 - client side only)
      const assignedDesigner =
        designers.find((d) => d.id === designerId)?.full_name || "Desainer";
      setInfoMsg(
        `Permintaan berhasil disetujui dan ditugaskan ke ${assignedDesigner}.`
      );

      loadRequests();
    } catch (error) {
      console.error("Gagal menugaskan:", error);
      setError(`Gagal menugaskan. ${error.message || error.toString()}`);
    } finally {
      setProcessingId(null);
    }
  };

  // --- FUNGSI UC-05: Menangani Aksi Approve/Revision ---
  const handleAction = async (requestId, actionType) => {
    if (actionType === "approve") {
      // Memicu modal penugasan (UC-06)
      const req = requests.find((r) => r.request_id === requestId);
      if (req) {
        setRequestToAssign(req);
      }
      return;
    }

    // Alur untuk Rejected (sebelumnya Revision)
    setProcessingId(requestId);
    setInfoMsg(null);
    if (
      !window.confirm(
        "Yakin ingin MENOLAK permintaan ini? Requester harus merevisi brief."
      )
    ) {
      setProcessingId(null);
      return;
    }

    try {
      // Update status menjadi Rejected
      await updateRequest(requestId, { status: "Rejected" });
      setInfoMsg(
        "Permintaan DITOLAK (Rejected). Requester harus memperbaiki brief."
      );
      loadRequests();
    } catch (error) {
      console.error(`Gagal ${actionType} permintaan:`, error);
      setError(`Gagal memproses aksi. ${error.message || error.toString()}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Memuat daftar persetujuan...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  const approvalRequests = requests.filter((req) => req.status === "Submitted");

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Daftar Permintaan yang Menunggu Persetujuan ({approvalRequests.length})
      </h1>
      <p className="mb-6 text-gray-600">
        Tinjau permintaan desain yang baru diajukan (Status: Submitted).
      </p>

      {infoMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {infoMsg}
        </div>
      )}

      {approvalRequests.length === 0 ? (
        <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-lg">
          Tidak ada permintaan desain yang menunggu persetujuan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul & Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenggat Waktu
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvalRequests.map((req) => (
                <tr key={req.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {req.title}
                    <button
                      onClick={() => setSelectedRequestToPreview(req)}
                      className="text-blue-500 hover:text-blue-700 ml-2"
                      title="Lihat Detail Brief dan Referensi"
                    >
                      <Eye className="w-4 h-4 inline-block" />
                    </button>
                    <div className="text-xs text-gray-500">{req.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Mengakses array hasil join dengan alias 'requester_info' */}
                    {req.requester_info ? req.requester_info.full_name : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.deadline).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleAction(req.request_id, "revise")}
                      disabled={processingId === req.request_id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Tolak / Minta Revisi Brief"
                    >
                      <X className="w-5 h-5 inline-block" />
                    </button>
                    <button
                      onClick={() => handleAction(req.request_id, "approve")}
                      disabled={processingId === req.request_id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      title="Tugaskan & Approve"
                    >
                      <UserCheck className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {selectedRequestToPreview && (
        <RequestPreviewModal
          request={selectedRequestToPreview}
          onClose={() => setSelectedRequestToPreview(null)}
        />
      )}

      {/* MODAL PENUGASAN (UC-06) */}
      {requestToAssign && (
        <AssignDesignerModal
          request={requestToAssign}
          designers={designers}
          loading={processingId === requestToAssign.request_id}
          onAssign={handleAssignment}
          onCancel={() => setRequestToAssign(null)}
        />
      )}
    </div>
  );
};

export default ApprovalList;
