// src/components/Sidebar.jsx

import React from "react";
import {
  Home,
  PlusCircle,
  CheckSquare,
  ClipboardList,
  BarChart,
  Users,
  ListOrdered,
} from "lucide-react";
import { useAuth } from "../AuthContext";

const iconMap = {
  Home: Home,
  PlusCircle: PlusCircle,
  CheckSquare: CheckSquare,
  ClipboardList: ClipboardList,
  BarChart: BarChart,
  Users: Users,
  ListOrdered: ListOrdered,
};

const SidebarIcon = ({ name, className = "w-5 h-5", strokeWidth = 2 }) => {
  const LucideIcon = iconMap[name];
  return LucideIcon ? (
    <LucideIcon className={className} strokeWidth={strokeWidth} />
  ) : null;
};

const menuGroups = [
  {
    title: "Dashboard",
    allowedRoles: ["DESIGNER", "REQUESTER", "ADMIN", "MANAGEMENT", "PRODUCER"],
    items: [{ name: "Dashboard", icon: "Home" }],
  },
  {
    title: "Design Request",
    allowedRoles: ["REQUESTER", "ADMIN", "MANAGEMENT", "PRODUCER"],
    items: [
      { name: "Buat Permintaan Baru", icon: "PlusCircle" },
      { name: "Daftar Permintaan Saya", icon: "ListOrdered" },
    ],
  },
  {
    title: "Workflow & Tugas",
    allowedRoles: ["DESIGNER", "PRODUCER", "ADMIN"],
    items: [
      { name: "Tugas Saya", icon: "ClipboardList" },
      { name: "Daftar Persetujuan", icon: "CheckSquare" },
    ],
  },
  {
    title: "Admin & Laporan",
    allowedRoles: ["ADMIN", "MANAGEMENT"],
    items: [
      { name: "Laporan & Analisis", icon: "BarChart" },
      { name: "Kelola Pengguna", icon: "Users" },
      { name: "Log Audit", icon: "ClipboardList" },
    ],
  },
];

const isRoleAllowed = (userRole, allowedRoles) => {
  if (!userRole) return false;
  const role = userRole.toUpperCase();
  return allowedRoles.some((allowed) => allowed.toUpperCase() === role);
};

const Sidebar = ({ activeMenu, setActiveMenu, isInactive }) => {
  const { userProfile } = useAuth();
  const currentUserRole = userProfile?.role || "REQUESTER";

  let groupsToRender = menuGroups;
  if (isInactive) {
    groupsToRender = [
      {
        title: "",
        allowedRoles: ["*"],
        items: [],
      },
    ];
  } else {
    groupsToRender = menuGroups.filter((group) =>
      isRoleAllowed(currentUserRole, group.allowedRoles)
    );
  }

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-100 fixed flex flex-col">
      <div className="p-5 text-xl font-extrabold text-gray-900 border-b border-gray-100 shadow-sm">
        Design Request Hub
      </div>

      <nav className="p-4 flex-1 overflow-y-auto">
        {groupsToRender.map((group, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              {group.title}
            </h3>
            <div className="space-y-1">
              {isInactive && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
                  Akses Dibatasi.
                </div>
              )}

              {group.items.map((item) => (
                <a
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150 text-sm
                    ${
                      activeMenu === item.name
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
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
