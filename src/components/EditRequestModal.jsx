import React, { useState } from "react";
import { updateRequest } from "../supabaseClient";
import { X } from "lucide-react";

const EditRequestModal = ({ request, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description || "",
    category: request.category,
    deadline: request.deadline
      ? new Date(request.deadline).toISOString().slice(0, 16)
      : "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const categories = ["Graphic", "Motion", "Game UI", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!formData.title || !formData.category || !formData.deadline) {
      setErrorMsg("Judul, kategori, dan tenggat waktu wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const updates = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        deadline: formData.deadline,
      };

      console.log(request);

      await updateRequest(request.request_id, updates);
      onSuccess(`Permintaan "${formData.title}" berhasil diperbarui.`);
      onClose();
    } catch (error) {
      console.error("Gagal memperbarui permintaan:", error);
      setErrorMsg(`Gagal memperbarui: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm("Apakah Anda yakin ingin membatalkan permintaan ini?")
    ) {
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      await updateRequest(request.request_id, { status: "Canceled" }); // FR-02
      onSuccess(`Permintaan "${request.title}" berhasil dibatalkan.`);
      onClose();
    } catch (error) {
      console.error("Gagal membatalkan permintaan:", error);
      setErrorMsg(`Gagal membatalkan: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">
            Edit Permintaan: {request.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleUpdate}>
          {/* Judul */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Judul
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Deskripsi Singkat
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kategori
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenggat Waktu */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tenggat Waktu
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Batalkan Permintaan
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRequestModal;
