// src/components/NotificationListModal.jsx

import React, { useState, useEffect } from "react";
import {
  X,
  Bell,
  MailOpen,
  AlertTriangle,
  CheckSquare,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import {
  fetchRecentNotifications,
  markNotificationsAsRead,
} from "../supabaseClient";
import { useAuth } from "../AuthContext";

/**
 * Helper: Menentukan warna dan ikon berdasarkan tipe event notifikasi
 */
const getEventTypeColor = (eventType) => {
  switch (eventType) {
    case "REQUEST_CREATED":
      return {
        color: "text-yellow-600 bg-yellow-50",
        icon: AlertTriangle,
        text: "Permintaan Baru",
      };
    case "REQUEST_APPROVED":
      return {
        color: "text-purple-600 bg-purple-50",
        icon: CheckSquare,
        text: "Disetujui & Ditugaskan",
      };
    case "REVISION_BRIEF":
      return {
        color: "text-red-600 bg-red-50",
        icon: RefreshCw,
        text: "Revisi Brief",
      };
    case "REQUEST_CANCELED":
      return {
        color: "text-gray-600 bg-gray-200",
        icon: XCircle,
        text: "Dibatalkan",
      };
    case "REVISION_DESIGN":
      return {
        color: "text-orange-600 bg-orange-50",
        icon: Send,
        text: "Revisi Desain",
      };
    case "COMPLETED":
      return {
        color: "text-green-600 bg-green-50",
        icon: CheckSquare,
        text: "Selesai (Completed)",
      };
    default:
      return {
        color: "text-gray-500 bg-gray-100",
        icon: Bell,
        text: "Pembaruan Status",
      };
  }
};

/**
 * Komponen: Item tunggal notifikasi
 */
const NotificationItem = ({ notification, onRead }) => {
  const isUnread = !notification.read_at;
  const {
    color,
    icon: Icon,
    text,
  } = getEventTypeColor(notification.event_type);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClick = () => {
    if (isUnread) {
      onRead([notification.id]);
    }
    console.log(`Open request: ${notification.request_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isUnread ? "bg-purple-50" : "bg-white"
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-2 rounded-full ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold ${
              isUnread ? "text-gray-900" : "text-gray-600"
            }`}
          >
            {text} • {notification.requests?.title || "Permintaan Dihapus"}
          </p>
          <p
            className={`mt-1 text-sm ${
              isUnread ? "font-medium text-gray-800" : "text-gray-500"
            }`}
          >
            {notification.message}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {formatTime(notification.sent_at)}
          </p>
        </div>
      </div>
      {isUnread && (
        <div className="flex justify-end pt-2">
          <span className="text-xs text-purple-600 font-bold">Baru</span>
        </div>
      )}
    </div>
  );
};

const NotificationListModal = ({ onClose }) => {
  const { user, loadNotificationCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Menggunakan fetchRecentNotifications dari supabaseClient.js
      const data = await fetchRecentNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      setError("Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (ids) => {
    try {
      await markNotificationsAsRead(user.id, ids);
      await loadNotifications();
      loadNotificationCount(user.id); // Reload badge count in header
    } catch (err) {
      console.error("Gagal menandai notifikasi terbaca:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length > 0) {
      await handleMarkAsRead(unreadIds);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mt-16 transform transition-transform duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Bell className="w-5 h-5 mr-2" /> Notifikasi{" "}
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="flex justify-end p-2 bg-gray-50">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs text-purple-600 hover:text-purple-700 disabled:text-gray-400"
            >
              Tandai Semua Sudah Dibaca
            </button>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Memuat...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Tidak ada notifikasi baru.
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationListModal;
