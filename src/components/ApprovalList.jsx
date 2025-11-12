import React, { useState, useEffect } from "react";
import { fetchRequestsForApproval, updateRequest } from "../supabaseClient";
import { Check, X, Eye } from "lucide-react";
import RequestPreviewModal from "./RequestPreviewModal";

const getStatusColor = (status) => {
  switch (status) {
    case "Submitted":
      return "bg-yellow-100 text-yellow-800";
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Revision":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ApprovalList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequestToPreview, setSelectedRequestToPreview] =
    useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequestsForApproval();
      setRequests(data);
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

  const handleAction = async (requestId, actionType) => {
    setProcessingId(requestId);
    setInfoMsg(null);
    let newStatus;
    let successMessage;

    if (actionType === "approve") {
      newStatus = "Approved";
      successMessage = "Permintaan berhasil disetujui (Approved).";
    } else {
      if (
        !window.confirm(
          "Yakin ingin mengembalikan permintaan ini untuk direvisi?"
        )
      ) {
        setProcessingId(null);
        return;
      }
      newStatus = "Revision";
      successMessage = "Permintaan dikembalikan untuk revisi (Revision).";
    }

    try {
      await updateRequest(requestId, { status: newStatus });
      setInfoMsg(successMessage);
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
        Tinjau permintaan desain yang baru diajukan (Status: Submitted) untuk
        disetujui atau dikembalikan untuk revisi brief.
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
                    {req.requester_info
                      ? req.requester_info.full_name
                      : "N/A (Cek RLS)"}
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
                      title="Setujui Permintaan"
                    >
                      <Check className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequestToPreview && (
        <RequestPreviewModal
          request={selectedRequestToPreview}
          onClose={() => setSelectedRequestToPreview(null)}
        />
      )}
    </div>
  );
};

export default ApprovalList;
