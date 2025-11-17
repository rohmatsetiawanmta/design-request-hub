// src/components/UserManagement.jsx

import React, { useState, useEffect } from "react";
import {
  fetchAllUsers,
  updateUserRoleAndStatus,
  createNewUserByAdmin, // Menggunakan fungsi Edge Function baru
} from "../supabaseClient";
import { useAuth } from "../AuthContext";
import {
  User,
  CheckCircle,
  XCircle,
  Settings,
  PlusCircle,
  Loader,
  X,
} from "lucide-react";

const roleColors = {
  ADMIN: "bg-red-100 text-red-800",
  MANAGEMENT: "bg-blue-100 text-blue-800",
  PRODUCER: "bg-purple-100 text-purple-800",
  DESIGNER: "bg-green-100 text-green-800",
  REQUESTER: "bg-yellow-100 text-yellow-800",
};

const UserManagement = () => {
  const { userProfile, user } = useAuth(); // Pastikan user diimpor dari useAuth
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editData, setEditData] = useState({ role: "", is_active: true });
  const availableRoles = [
    "REQUESTER",
    "DESIGNER",
    "PRODUCER",
    "MANAGEMENT",
    "ADMIN",
  ];

  // NEW STATE FOR ADD USER
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "REQUESTER", // Default role
  });
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
      setError(
        "Gagal memuat daftar pengguna. Pastikan koneksi Supabase & tabel terkonfigurasi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditClick = (user) => {
    setIsEditing(user);
    setEditData({ role: user.role, is_active: user.is_active });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInfoMsg(null);
    setError(null);

    // Dapatkan ID Admin/Manager yang melakukan aksi (untuk Audit Trail)
    const changerId = user.id;

    // Pencegahan keamanan: Admin tidak boleh menonaktifkan atau menurunkan peran dirinya sendiri
    if (
      isEditing.id === userProfile.id &&
      (editData.role !== userProfile.role || !editData.is_active)
    ) {
      setError(
        "Anda tidak dapat menonaktifkan atau menurunkan peran Anda sendiri."
      );
      setLoading(false);
      return;
    }

    // Konfirmasi penurunan peran ADMIN
    if (isEditing.role === "ADMIN" && editData.role !== "ADMIN") {
      if (
        !window.confirm(
          "PERINGATAN: Anda mencoba menurunkan peran pengguna ADMIN. Lanjutkan?"
        )
      ) {
        setLoading(false);
        return;
      }
    }

    try {
      await updateUserRoleAndStatus(
        isEditing.id,
        editData.role,
        editData.is_active,
        changerId // Meneruskan ID Admin untuk Audit
      );
      setInfoMsg(`Pengguna ${isEditing.full_name} berhasil diperbarui.`);
      setIsEditing(null);
      loadUsers(); // Refresh list
    } catch (err) {
      console.error("Gagal menyimpan perubahan:", err);
      setError(`Gagal memperbarui pengguna: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userToDeactivate) => {
    if (userToDeactivate.id === userProfile.id) {
      alert("Anda tidak dapat menonaktifkan akun Anda sendiri!");
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin MENONAKTIFKAN pengguna ${userToDeactivate.full_name}?`
      )
    ) {
      return;
    }

    setLoading(true);
    setInfoMsg(null);
    setError(null);

    // Dapatkan ID Admin/Manager yang melakukan aksi (untuk Audit Trail)
    const changerId = user.id;

    try {
      // Deactivate dengan set is_active = false
      await updateUserRoleAndStatus(
        userToDeactivate.id,
        userToDeactivate.role,
        false,
        changerId
      );
      setInfoMsg(
        `Pengguna ${userToDeactivate.full_name} berhasil dinonaktifkan.`
      );
      loadUsers();
    } catch (err) {
      setError(
        `Gagal menonaktifkan pengguna: ${err.message || err.toString()}`
      );
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI BARU: SUBMIT USER BARU
  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingNewUser(true);
    setInfoMsg(null);
    setError(null);

    if (
      !newUserData.email ||
      !newUserData.password ||
      !newUserData.fullName ||
      newUserData.password.length < 6
    ) {
      setError("Semua field wajib diisi, dan password minimal 6 karakter.");
      setIsSubmittingNewUser(false);
      return;
    }

    try {
      const result = await createNewUserByAdmin(
        newUserData.email,
        newUserData.password,
        newUserData.fullName,
        newUserData.role
      );

      // Pastikan Edge Function mengembalikan objek user yang valid
      setInfoMsg(
        `Pengguna baru ${
          result.full_name || newUserData.fullName
        } berhasil ditambahkan sebagai ${result.role || newUserData.role}.`
      );
      setNewUserData({
        email: "",
        password: "",
        fullName: "",
        role: "REQUESTER",
      }); // Reset form
      setIsAddModalOpen(false); // Tutup modal
      loadUsers(); // Refresh daftar pengguna
    } catch (err) {
      // Tangani error dari Edge Function
      setError(
        `Gagal menambahkan pengguna: ${
          err.message ||
          'Terjadi kesalahan sistem. Pastikan Edge Function "admin-create-user" sudah deploy.'
        }`
      );
      console.error("New User Submission Error:", err);
    } finally {
      setIsSubmittingNewUser(false);
    }
  };
  // END: FUNGSI BARU

  if (loading && users.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        Memuat daftar pengguna...
      </div>
    );
  }

  if (error && !isEditing && !isAddModalOpen) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dan Tombol Tambah Pengguna */}
      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <User className="w-6 h-6" />
          <span>Kelola Pengguna ({users.length})</span>
        </h1>
        <button
          onClick={() => {
            setError(null); // Clear error state saat buka modal
            setIsAddModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Tambah Pengguna Baru
        </button>
      </div>

      {/* Pesan Info/Error */}
      <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
        <p className="mb-4 text-gray-600">
          Modifikasi peran dan status keaktifan pengguna di sistem Design
          Request Hub.
        </p>

        {infoMsg && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            {infoMsg}
          </div>
        )}
        {error && isEditing && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peran
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
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {userItem.full_name}{" "}
                    {userItem.id === userProfile?.id && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        Anda
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {userItem.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        roleColors[userItem.role]
                      }`}
                    >
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {userItem.is_active ? (
                      <span className="text-green-600 inline-flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Aktif</span>
                      </span>
                    ) : (
                      <span className="text-red-600 inline-flex items-center space-x-1">
                        <XCircle className="w-4 h-4" />
                        <span>Nonaktif</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(userItem)}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50 inline-flex items-center"
                      disabled={loading}
                    >
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Pengguna (Sudah ada) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm"
          >
            <h3 className="text-xl font-bold mb-4">
              Edit Pengguna: {isEditing.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peran (Role)
                </label>
                <select
                  value={editData.role}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status Keaktifan
                </label>
                <select
                  value={editData.is_active}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      is_active: e.target.value === "true",
                    }))
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading || isEditing.id === userProfile.id}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
                {isEditing.id === userProfile.id && (
                  <p className="text-xs text-red-500 mt-1">
                    Tidak dapat menonaktifkan akun sendiri.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(null)}
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
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Tambah Akun Pengguna Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {error &&
              !isEditing && ( // Tampilkan error khusus modal add user
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}
            <form onSubmit={handleNewUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.fullName}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmittingNewUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmittingNewUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Minimal 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newUserData.password}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmittingNewUser}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pengguna harus mengganti password setelah login pertama.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peran Awal
                </label>
                <select
                  required
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmittingNewUser}
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setError(null); // Clear error state saat tutup modal
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors mr-3"
                  disabled={isSubmittingNewUser}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    isSubmittingNewUser
                      ? "bg-purple-400"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  disabled={isSubmittingNewUser}
                >
                  {isSubmittingNewUser ? (
                    <div className="flex items-center">
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Mendaftarkan...
                    </div>
                  ) : (
                    "Daftarkan Pengguna"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
