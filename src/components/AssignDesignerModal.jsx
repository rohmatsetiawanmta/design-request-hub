import React, { useState } from "react";
import { UserCheck } from "lucide-react";

const AssignDesignerModal = ({
  request,
  designers,
  onAssign,
  onCancel,
  loading,
}) => {
  const [selectedDesignerId, setSelectedDesignerId] = useState("");

  const oldDesignerId = request.designer_id;
  const isReassignment = !!oldDesignerId;

  const requesterName = request.requester_info
    ? request.requester_info.full_name
    : "N/A";

  const handleConfirm = () => {
    if (selectedDesignerId) {
      if (isReassignment && selectedDesignerId === oldDesignerId) {
        alert(
          "Silakan pilih Desainer baru. Desainer yang dipilih sama dengan yang lama."
        );
        return;
      }

      onAssign(request.request_id, selectedDesignerId, oldDesignerId);
    } else {
      alert("Harap pilih Desainer sebelum menugaskan.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4">
          {isReassignment ? "Tugaskan Ulang Desainer" : "Tugaskan Desainer"}
        </h3>
        <p className="mb-2 text-sm text-gray-700">
          Permintaan: <strong>{request.title}</strong>
        </p>
        {isReassignment && (
          <p className="mb-1 text-xs text-red-500">
            Ditugaskan saat ini:{" "}
            {designers.find((d) => d.id === oldDesignerId)?.full_name || "N/A"}
          </p>
        )}
        <p className="mb-4 text-xs text-gray-500">Requester: {requesterName}</p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Desainer {isReassignment ? "Baru" : ""}{" "}
          <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedDesignerId}
          onChange={(e) => setSelectedDesignerId(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          disabled={loading}
        >
          <option value="">-- Pilih Desainer --</option>
          {designers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedDesignerId}
            className="px-4 py-2 text-sm rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : isReassignment
              ? "Tugaskan Ulang"
              : "Tugaskan & Approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDesignerModal;
