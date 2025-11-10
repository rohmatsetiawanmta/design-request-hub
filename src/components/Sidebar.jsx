import React from "react";
import {
  Home,
  PlusCircle,
  CheckSquare,
  ClipboardList,
  BarChart,
  Users,
} from "lucide-react";

// Peta Ikon Lucide untuk Sidebar
const iconMap = {
  Home: Home,
  PlusCircle: PlusCircle,
  CheckSquare: CheckSquare,
  ClipboardList: ClipboardList,
  BarChart: BarChart,
  Users: Users,
};

// Komponen Ikon sederhana yang mengambil komponen Lucide dari peta
const SidebarIcon = ({ name, className = "w-5 h-5", strokeWidth = 2 }) => {
  const LucideIcon = iconMap[name];
  return LucideIcon ? (
    <LucideIcon className={className} strokeWidth={strokeWidth} />
  ) : null;
};

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

const Sidebar = ({ activeMenu, setActiveMenu }) => {
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
                  {/* Menggunakan SidebarIcon yang telah dimodifikasi */}
                  <SidebarIcon name={item.icon} className="w-5 h-5 mr-3" />
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

export default Sidebar;
