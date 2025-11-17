import React, { useState } from "react";
import { Settings, Bell, LogOut } from "lucide-react";
import { logout } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import NotificationListModal from "./NotificationListModal";

const Header = ({ title }) => {
  const {
    userProfile,
    setSession,
    unreadNotificationCount,
    loadNotificationCount,
    user,
  } = useAuth();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

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

  const handleBellClick = () => {
    if (user) {
      setIsNotificationModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsNotificationModalOpen(false);
    if (user?.id) {
      loadNotificationCount(user.id);
    }
  };

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
      <div className="text-xl font-bold text-gray-800">{title}</div>

      <div className="flex items-center space-x-6">
        <button
          onClick={handleBellClick}
          className="text-gray-500 hover:text-purple-600 transition-colors relative"
        >
          <Bell className="w-6 h-6" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </span>
          )}
        </button>
        <button className="text-gray-500 hover:text-purple-600 transition-colors">
          <Settings className="w-6 h-6" />
        </button>

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold">
            {getInitials(fullName)}
          </div>
        </div>
      </div>

      {isNotificationModalOpen && (
        <NotificationListModal onClose={handleCloseModal} />
      )}
    </header>
  );
};

export default Header;
