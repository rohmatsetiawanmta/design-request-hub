// src/components/AuditLogViewer.jsx

import React, { useState, useEffect } from "react";
import { fetchAuditLogs } from "../supabaseClient";
import { Clock } from "lucide-react";

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchAuditLogs();
        setLogs(data);
      } catch (err) {
        setError(
          "Gagal memuat log audit. Pastikan tabel audit_logs sudah benar."
        );
        console.error("Audit log loading failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const formatActionType = (type) => {
    switch (type) {
      case "ROLE_CHANGE":
        return "Perubahan Peran 🔄";
      case "DEACTIVATION":
        return "Akun Dinonaktifkan ⛔";
      case "REACTIVATION":
        return "Akun Diaktifkan ✅";
      case "USER_UPDATE":
        return "Profil Diperbarui ✍️";
      default:
        return type;
    }
  };

  const renderChanges = (oldVal, newVal) => {
    // Hanya fokus pada role dan is_active untuk tampilan ringkas
    const changes = [];

    // Perubahan Peran
    if (oldVal.role !== newVal.role) {
      changes.push(
        <span key="role" className="block text-sm">
          Peran:
          <br />
          <strong>{oldVal.role}</strong> ➝ <strong>{newVal.role}</strong>
        </span>
      );
    }

    // Perubahan Status Aktif
    if (oldVal.is_active !== newVal.is_active) {
      const statusText = newVal.is_active ? "AKTIF" : "NONAKTIF";
      changes.push(
        <span key="active" className="block text-sm">
          Status:
          <br />
          <strong>{oldVal.is_active ? "AKTIF" : "NONAKTIF"}</strong> ➝{" "}
          <strong>{statusText}</strong>
        </span>
      );
    }

    return changes.length > 0 ? (
      changes
    ) : (
      <span className="text-sm italic text-gray-500">Lihat deskripsi</span>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <Clock className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-3" />
        <p className="text-gray-700">Memuat Log Audit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2">
          Log Audit Pengguna
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dilakukan Oleh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perubahan Detail
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.log_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatActionType(log.action_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {log.changer?.full_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {log.target_user?.full_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.old_value && log.new_value
                      ? renderChanges(log.old_value, log.new_value)
                      : log.description}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500 italic"
                  >
                    Belum ada catatan log audit yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
