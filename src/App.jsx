import React, { useState } from "react";
// Import klien Supabase dipertahankan, tapi tidak digunakan langsung di komponen layout ini.
// import { supabase } from "./supabaseClient";

// Import komponen yang telah dipecah
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardContent from "./components/DashboardContent";

const App = () => {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Menentukan judul header berdasarkan menu aktif
  const headerTitle = activeMenu.includes("Permintaan")
    ? "Buat Permintaan Desain"
    : activeMenu.includes("Persetujuan")
    ? "Daftar Persetujuan"
    : activeMenu;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar (Fixed width) */}
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Content Area */}
      <div className="ml-64 flex-1">
        {/* Header (Fixed Top) */}
        <Header title={headerTitle} />

        {/* Konten Halaman (dengan padding untuk Header) */}
        <main className="p-8 pt-24">
          {/* Menampilkan konten berdasarkan menu yang aktif */}
          {activeMenu === "Dashboard" && <DashboardContent />}

          {/* Placeholder untuk halaman lain */}
          {activeMenu !== "Dashboard" && (
            <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800">
                Halaman {activeMenu}
              </h1>
              <p className="mt-4 text-gray-600">
                Ini adalah area di mana fungsionalitas {activeMenu} akan
                diimplementasikan.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
