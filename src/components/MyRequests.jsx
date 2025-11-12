import React, { useState, useEffect } from "react";
import { fetchMyRequests } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import EditRequestModal from "./EditRequestModal";
import ReviewRequestModal from "./ReviewRequestModal";
import { Edit, Eye } from "lucide-react";

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
    case "Canceled":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequestToEdit, setSelectedRequestToEdit] = useState(null);
  const [selectedRequestToReview, setSelectedRequestToReview] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  const loadRequests = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyRequests(user.id);
      setRequests(data);
    } catch (err) {
      console.error("Gagal memuat permintaan:", err);
      setError("Gagal memuat data permintaan Anda. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleSuccess = (message) => {
    setInfoMsg(message);
    setSelectedRequestToEdit(null);
    setSelectedRequestToReview(null);
    loadRequests();
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Memuat permintaan...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  const isEditable = (status) => status === "Submitted";
  const isReviewable = (status) => status === "For Review";

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Daftar Permintaan Saya ({requests.length})
      </h1>
      <p className="mb-6 text-gray-600">
        Anda dapat mengedit/membatalkan permintaan berstatus{" "}
        <strong>Submitted</strong> atau meninjau hasil desain berstatus{" "}
        <strong>For Review</strong>.
      </p>

      {infoMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {infoMsg}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-lg">
          Belum ada permintaan desain yang diajukan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenggat Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.deadline).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isReviewable(req.status) ? (
                      <button
                        onClick={() => setSelectedRequestToReview(req)}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 inline-flex items-center space-x-1"
                        title="Tinjau dan Beri Feedback"
                      >
                        <Eye className="w-5 h-5 inline-block" />
                        <span>Review</span>
                      </button>
                    ) : isEditable(req.status) ? (
                      <button
                        onClick={() => setSelectedRequestToEdit(req)}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        title="Edit atau Batalkan Permintaan"
                      >
                        <Edit className="w-5 h-5 inline-block" />
                      </button>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequestToEdit && isEditable(selectedRequestToEdit.status) && (
        <EditRequestModal
          request={selectedRequestToEdit}
          onClose={() => {
            setSelectedRequestToEdit(null);
            setInfoMsg(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {selectedRequestToReview &&
        isReviewable(selectedRequestToReview.status) && (
          <ReviewRequestModal
            request={selectedRequestToReview}
            onClose={() => setSelectedRequestToReview(null)}
            onSuccess={handleSuccess}
          />
        )}
    </div>
  );
};

export default MyRequests;
