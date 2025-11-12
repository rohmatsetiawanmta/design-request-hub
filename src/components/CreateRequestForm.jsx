import React, { useState } from "react";
import { createRequest, uploadReferenceFile } from "../supabaseClient";
import { useAuth } from "../AuthContext";

const initialFormState = {
  title: "",
  description: "",
  category: "Graphic",
  deadline: "",
  referenceFile: null,
};

const CreateRequestForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = ["Graphic", "Motion", "Game UI", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, referenceFile: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!user || !user.id) {
      setErrorMsg("Error: Pengguna tidak terautentikasi.");
      setLoading(false);
      return;
    }

    if (!formData.title || !formData.category || !formData.deadline) {
      setErrorMsg("Judul, kategori, dan tenggat waktu wajib diisi.");
      setLoading(false);
      return;
    }

    let fileUrl = null;

    try {
      if (formData.referenceFile) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (formData.referenceFile.size > MAX_FILE_SIZE) {
          throw new Error("Ukuran file melebihi batas maksimum 5MB.");
        }

        fileUrl = await uploadReferenceFile(formData.referenceFile, user.id);
        console.log("File referensi berhasil diunggah:", fileUrl);
      }

      const requestData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        deadline: formData.deadline,
        reference_url: fileUrl,
      };

      const newRequest = await createRequest(requestData, user.id);
      setSuccessMsg(
        `Permintaan "${newRequest.title}" berhasil dibuat dengan status Submitted.`
      );
      setFormData(initialFormState);
    } catch (error) {
      console.error("Gagal membuat permintaan:", error);
      setErrorMsg(
        `Gagal membuat permintaan: ${error.message || error.toString()}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Buat Permintaan Desain Baru
      </h1>

      {errorMsg && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {successMsg}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Judul Permintaan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deskripsi Singkat
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            disabled={loading}
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kategori Desain <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tenggat Waktu <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unggah Referensi Desain (Opsional)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Maks. 5MB (Format: JPG, PNG, PDF)
          </p>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          {loading ? "Mengirim Permintaan..." : "Kirim Permintaan"}
        </button>
      </form>
    </div>
  );
};

export default CreateRequestForm;
