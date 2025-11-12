import React from "react";
import { Settings, Bell, LogOut } from "lucide-react";
import { logout } from "../supabaseClient";
import { useAuth } from "../AuthContext";

const Header = ({ title }) => {
  const { userProfile, setSession } = useAuth();

  // Gunakan data dari userProfile atau fallback jika null
  const fullName = userProfile?.full_name || "Nama Pengguna";
  const role = userProfile?.role || "Guest";

  const handleLogout = async () => {
    try {
      await logout();
      setSession(null);
    } catch (error) {
      console.error("Logout gagal:", error.message);
      alert("Gagal logout. Silakan coba lagi.");
    }
  };

  // Fungsi untuk mendapatkan inisial
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm fixed top-0 left-64 right-0 z-10">
      {/* Judul Halaman Utama */}
      <div className="text-xl font-bold text-gray-800">{title}</div>

      {/* Aksi & Profil Pengguna (Dinamic) */}
      <div className="flex items-center space-x-6">
        {/* Ikon Notifikasi dan Settings */}
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Bell className="w-6 h-6" />
        </button>
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Settings className="w-6 h-6" />
        </button>

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>

        {/* User Profile Box (Dinamic) */}
        <div className="flex items-center space-x-3">
          <div>
            {/* Menggunakan full_name dari userProfile */}
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            {/* Menggunakan role dari userProfile */}
            <p className="text-xs text-gray-500">{role}</p>
          </div>
          {/* Avatar Dinamis */}
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold">
            {getInitials(fullName)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
