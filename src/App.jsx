import React, { useState } from "react";
// Import klien Supabase dipertahankan, tapi tidak digunakan langsung di komponen layout ini.
// import { supabase } from "./supabaseClient";

// --- Komponen Ikon Placeholder (Mensimulasikan Ikon Profesional) ---

const Icon = ({ name, className = "w-5 h-5" }) => {
  // Dalam proyek nyata, ini akan digantikan dengan import dari library ikon (misal: Lucide, Heroicons)
  const icons = {
    Home: "🏠",
    PlusCircle: "➕",
    CheckSquare: "✅",
    ClipboardList: "📋",
    BarChart: "📊",
    Users: "👥",
    Settings: "⚙️",
    Bell: "🔔",
  };
  return (
    <span className={`text-lg leading-none ${className}`}>
      {icons[name] || name}
    </span>
  );
};

// --- 1. Sidebar Component (Navigasi Sisi Kiri) ---

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const menuGroups = [
    {
      title: "Design Request",
      role: "REQUESTER",
      items: [
        { name: "Dashboard", icon: "Home" },
        { name: "Buat Permintaan Baru", icon: "PlusCircle" },
      ],
    },
    {
      title: "Workflow & Tugas",
      role: "DESIGNER/LINEPRODUCER",
      items: [
        { name: "Tugas Saya", icon: "ClipboardList" },
        { name: "Daftar Persetujuan", icon: "CheckSquare" },
      ],
    },
    {
      title: "Admin & Laporan",
      role: "ADMIN/MANAGEMENT",
      items: [
        { name: "Laporan & Analisis", icon: "BarChart" },
        { name: "Kelola Pengguna", icon: "Users" },
      ],
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-100 fixed flex flex-col">
      {/* Brand Header: Lebih besar dan meniru style clean-header HRIS */}
      <div className="p-5 text-xl font-extrabold text-gray-900 border-b border-gray-100 shadow-sm">
        Design Request Hub
      </div>

      {/* Navigasi Menu */}
      <nav className="p-4 flex-1 overflow-y-auto">
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-6">
            {/* Title Grouping (Mirip SUPERVISOR/REVIEWEE di Sirogu360) */}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <a
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  // Style active state dengan aksen ungu yang lebih kuat dan hover yang halus
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150 text-sm
                    ${
                      activeMenu === item.name
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon name={item.icon} className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

// --- 2. Header Component (Bar Atas) ---

const Header = ({ title }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm fixed top-0 left-64 right-0 z-10">
      {/* Judul Halaman Utama */}
      <div className="text-xl font-bold text-gray-800">{title}</div>

      {/* Aksi & Profil Pengguna (Mirip HRIS) */}
      <div className="flex items-center space-x-6">
        {/* Ikon Notifikasi dan Settings */}
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Icon name="Bell" className="w-6 h-6" />
        </button>
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Icon name="Settings" className="w-6 h-6" />
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

// --- 3. Metric Card Component ---

const MetricCard = ({ title, value, detail, color = "purple" }) => {
  const colorClasses = {
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    green: "text-green-600 bg-green-50 border-green-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
  };

  return (
    <div className={`p-6 rounded-xl shadow-md border ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600 uppercase mb-1">
        {title}
      </p>
      <h2 className="text-4xl font-bold">{value}</h2>
      <p className="text-xs mt-2 font-medium text-gray-500">{detail}</p>
    </div>
  );
};

// --- 4. Main Content: Dashboard ---

const DashboardContent = () => {
  // Data metrik mengadopsi FR-08/FR-14 (status permintaan)
  const metrics = [
    {
      title: "Total Requests",
      value: 275,
      detail: "Total permintaan tahun ini",
      color: "blue",
    },
    {
      title: "Submitted (New)",
      value: 12,
      detail: "Siap ditinjau Line Producer",
      color: "yellow",
    },
    {
      title: "In Progress",
      value: 45,
      detail: "Sedang dikerjakan Designer",
      color: "purple",
    },
    {
      title: "QC Completed",
      value: 218,
      detail: "Telah selesai & siap diarsipkan",
      color: "green",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 4.1. Ringkasan Metrik (Mirip HRIS Metrics Cards) */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* 4.2. Tabel Detail (Mirip HRIS Table) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Permintaan Aktif
          </h2>
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
            Lihat Semua ({metrics[1].value + metrics[2].value} Item)
          </button>
        </div>

        {/* Placeholder untuk Tabel dengan Filter & Data */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Placeholder Data Baris */}
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Request Game UI: Episode 12
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Bryan Carolus
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Revision Needed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Nov 15, 2025
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 5. App Component Utama ---

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
