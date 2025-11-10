import React from "react";
import { Settings, Bell } from "lucide-react"; // Impor langsung ikon Lucide

const Header = ({ title }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm fixed top-0 left-64 right-0 z-10">
      {/* Judul Halaman Utama */}
      <div className="text-xl font-bold text-gray-800">{title}</div>

      {/* Aksi & Profil Pengguna (Mirip HRIS) */}
      <div className="flex items-center space-x-6">
        {/* Menggunakan komponen Lucide secara langsung */}
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Bell className="w-6 h-6" />
        </button>
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Settings className="w-6 h-6" />
        </button>

        {/* User Profile Box (Lebih Profesional) */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Rohmat Setiawan
            </p>
            <p className="text-xs text-gray-500">Senior Academic Specialist</p>
          </div>
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold">
            RS
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
