import React from "react";
import { X, ExternalLink } from "lucide-react";

const RequestPreviewModal = ({ request, onClose }) => {
  if (!request) return null;

  const formattedDeadline = new Date(request.deadline).toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const requesterName =
    request.requester_info && request.requester_info.length > 0
      ? request.requester_info[0].full_name
      : "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-purple-700">
            Preview Permintaan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          {request.title}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-4 border-b border-gray-100">
          <p>
            <strong>Requester:</strong> {requesterName}
          </p>
          <p>
            <strong>Kategori:</strong> {request.category}
          </p>
          <p>
            <strong>Tenggat Waktu:</strong> {formattedDeadline}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold text-sm ${
                request.status === "Submitted"
                  ? "text-yellow-600"
                  : "text-purple-600"
              }`}
            >
              {request.status}
            </span>
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-2">
            Deskripsi/Brief:
          </h4>
          <p className="p-3 bg-gray-50 border rounded-lg text-gray-700 whitespace-pre-wrap">
            {request.description || "Tidak ada deskripsi singkat."}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">
            File Referensi:
          </h4>
          {request.reference_url ? (
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <a
                href={request.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1"
              >
                <span>Lihat File Referensi (Klik untuk Buka)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="mt-3 max-h-60 overflow-hidden border-t border-gray-200 pt-3">
                {request.reference_url.match(/\.(jpeg|jpg|gif|png)$/i) && (
                  <img
                    src={request.reference_url}
                    alt="Reference Preview"
                    className="w-full h-auto object-contain rounded-md"
                  />
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Tidak ada file referensi diunggah.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestPreviewModal;
