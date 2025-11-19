import React, { useState } from "react";
import { uploadDesignAsset, updateRequest, runAIQC } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import { X } from "lucide-react";

const UploadDesignModal = ({ task, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isRevision = task.status === "Revision";

  const newVersionNo = isRevision ? (task.version_no || 0) + 1 : 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!file) {
      setErrorMsg("File desain wajib diunggah.");
      setLoading(false);
      return;
    }

    try {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Ukuran file melebihi batas maksimum 5MB.");
      }

      const fileUrl = await uploadDesignAsset(file, task.request_id, user.id);

      const newStatus = "For Review";

      await updateRequest(task.request_id, {
        status: newStatus,
        latest_design_url: fileUrl,
        designer_notes: notes,
        version_no: newVersionNo,
      });

      const aiReport = await runAIQC(
        task.request_id,
        newVersionNo,
        task.title,
        task.description,
        isRevision
      );

      let successMessage = `Hasil desain ${
        isRevision ? "revisi ke-" + newVersionNo : "awal"
      } berhasil diunggah. Status diubah menjadi 'For Review'.`;

      if (aiReport && aiReport.issue_count > 0) {
        successMessage += ` Peringatan: QC Otomatis menemukan ${aiReport.issue_count} potensi isu (Ejaan/CV). Reviewer akan meninjau.`;
      } else if (aiReport) {
        successMessage += ` QC Otomatis bersih (0 Isu terdeteksi).`;
      } else {
        successMessage += ` Peringatan: QC Otomatis sedang diproses atau gagal di server. Reviewer harus melakukan tinjauan manual.`;
      }

      onSuccess(successMessage);
      onClose();
    } catch (error) {
      console.error("Gagal mengunggah desain:", error);
      setErrorMsg(
        `Gagal mengunggah: ${
          error.message ||
          "Pastikan Anda memiliki akses ke bucket 'design-assets' dan Edge Function 'qc-ai-processor' berfungsi."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-xl font-bold">
            Unggah {isRevision ? `Revisi Ke-${newVersionNo}` : "Hasil Awal"}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="mb-4 text-sm text-purple-600 font-medium">
          Permintaan: {task.title} (Status Saat Ini: {task.status})
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pilih File Desain (Max 5MB){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Catatan/Ringkasan Perubahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Mengunggah..." : "Submit Desain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDesignModal;
