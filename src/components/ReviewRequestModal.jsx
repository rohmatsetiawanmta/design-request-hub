import React, { useState, useEffect } from "react";
import {
  submitReviewAndChangeStatus,
  archiveDesign,
  fetchQCReport,
} from "../supabaseClient";
import { useAuth } from "../AuthContext";
import {
  X,
  ExternalLink,
  Send,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";

const ReviewRequestModal = ({ request, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [aiReport, setAiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);

  const currentVersion = request.version_no || 1;

  useEffect(() => {
    const loadReport = async () => {
      setLoadingReport(true);
      try {
        const report = await fetchQCReport(request.request_id, currentVersion);
        setAiReport(report);
      } catch (err) {
        console.error("Gagal memuat laporan QC AI:", err);
      } finally {
        setLoadingReport(false);
      }
    };
    loadReport();
  }, [request.request_id, currentVersion]);

  const handleRevision = async () => {
    setErrorMsg("");
    if (!feedbackText.trim()) {
      setErrorMsg(
        "Umpan balik atau catatan revisi wajib diisi untuk meminta revisi."
      );
      return;
    }
    setLoading(true);

    try {
      await submitReviewAndChangeStatus(
        request.request_id,
        user.id,
        request.version_no || 1,
        feedbackText.trim(),
        "Revision"
      );

      onSuccess(
        `Permintaan "${request.title}" (V${
          request.version_no || 1
        }) dikirim kembali untuk revisi.`
      );
      onClose();
    } catch (error) {
      console.error("Gagal meminta revisi:", error);
      setErrorMsg(`Gagal meminta revisi: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin MENYELESAIKAN permintaan ini? Status akan diubah menjadi Completed."
      )
    ) {
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await submitReviewAndChangeStatus(
        request.request_id,
        user.id,
        request.version_no || 1,
        feedbackText.trim(),
        "Completed"
      );

      const finalDesignUrl = request.latest_design_url;
      if (finalDesignUrl) {
        await archiveDesign(request.request_id, finalDesignUrl);
      } else {
        console.warn("URL desain terbaru tidak ditemukan. Arsip dilewati.");
      }

      onSuccess(
        `Permintaan "${request.title}" berhasil diselesaikan (Completed) dan desain final diarsipkan.`
      );
      onClose();
    } catch (error) {
      console.error("Gagal menyelesaikan permintaan:", error);
      setErrorMsg(`Gagal menyelesaikan: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">
            Tinjau Desain: {request.title} (V{currentVersion})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-purple-600" />
            Laporan QC Otomatis (AI)
          </h4>

          {loadingReport ? (
            <p className="text-sm text-gray-500 italic">
              Memuat hasil analisis AI...
            </p>
          ) : aiReport ? (
            <div className="space-y-3">
              <div className="text-sm">
                <p
                  className={`font-medium ${
                    aiReport.issue_count > 0 ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {aiReport.issue_count > 0 ? (
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                  ) : (
                    <CheckSquare className="w-4 h-4 inline mr-1" />
                  )}
                  Status Ejaan/Bahasa:{" "}
                  {aiReport.issue_count > 0
                    ? `${aiReport.issue_count} Isu Ditemukan`
                    : "Bersih"}
                </p>

                {aiReport.nlp_findings_array?.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-red-600 ml-4 mt-1">
                    {aiReport.nlp_findings_array.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              {aiReport.cv_diff_ref !== "NONE" && (
                <p className="text-sm text-gray-700">
                  <strong>Perbandingan Visual:</strong> {aiReport.cv_diff_ref}
                </p>
              )}
              <p className="text-xs text-gray-500 italic border-t pt-2 mt-2">
                {aiReport.ocr_text}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Laporan QC Otomatis (V{currentVersion}) belum tersedia.
            </p>
          )}
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Hasil Desain Terbaru:
          </p>
          {request.latest_design_url ? (
            <a
              href={request.latest_design_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1 p-3 border rounded-lg bg-purple-50"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Lihat/Unduh File Desain V{request.version_no || 1}</span>
            </a>
          ) : (
            <p className="text-gray-500 italic">URL Desain tidak ditemukan.</p>
          )}

          <p className="text-xs text-gray-500 pt-1">
            Catatan Desainer: {request.designer_notes || "Tidak ada catatan."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Umpan Balik / Catatan Revisi
              <span className="text-gray-400"> (Opsional - akan dicatat)</span>
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows="4"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              placeholder="Masukkan detail revisi yang diperlukan di sini, atau catatan persetujuan jika mengklik Complete."
            />
          </div>

          <div className="flex justify-between pt-4 space-x-3">
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Menyelesaikan..." : "Approve & Complete"}
            </button>
            <button
              type="button"
              onClick={handleRevision}
              disabled={loading || !feedbackText.trim()}
              className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              title="Kirim catatan revisi dan ubah status menjadi Revision"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Mengirim Revisi..." : "Kirim Revisi (Revision)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewRequestModal;
