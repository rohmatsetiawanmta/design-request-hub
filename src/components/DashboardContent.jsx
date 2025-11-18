// src/components/DashboardContent.jsx (REFACTORED)

import React, { useState, useEffect } from "react";
import MetricCard from "./MetricCard";
import {
  fetchDashboardData,
  fetchActiveRequestsForTable,
} from "../supabaseClient";

const getStatusColor = (status) => {
  switch (status) {
    case "Submitted":
      return "bg-yellow-100 text-yellow-800";
    case "In Progress":
    case "Approved":
      return "bg-purple-100 text-purple-800";
    case "For Review":
    case "Revision":
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const DashboardContent = () => {
  const [metrics, setMetrics] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculateMetrics = (data) => {
    const totalRequests = data.length;
    const submittedCount = data.filter((r) => r.status === "Submitted").length;
    const inProgressCount = data.filter(
      (r) =>
        r.status === "Approved" ||
        r.status === "In Progress" ||
        r.status === "For Review" ||
        r.status === "Revision"
    ).length;
    const completedCount = data.filter((r) => r.status === "Completed").length;

    return [
      {
        title: "Total Requests",
        value: totalRequests,
        detail: "Total permintaan keseluruhan",
        color: "blue",
      },
      {
        title: "Submitted (New)",
        value: submittedCount,
        detail: "Siap ditinjau Line Producer",
        color: "yellow",
      },
      {
        title: "In Progress",
        value: inProgressCount,
        detail: "Sedang dikerjakan Designer",
        color: "purple",
      },
      {
        title: "QC Completed",
        value: completedCount,
        detail: "Telah selesai & siap diarsipkan",
        color: "green",
      },
    ];
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil data dashboard TANPA filter (global data)
      const allRequests = await fetchDashboardData({});

      // Ambil data tabel aktif (5 item teratas)
      const activeTableData = await fetchActiveRequestsForTable();

      setMetrics(calculateMetrics(allRequests));
      setActiveRequests(activeTableData);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      setError(
        "Gagal memuat data dashboard. Pastikan koneksi Supabase & tabel terkonfigurasi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Memuat data hanya saat komponen dimuat
    loadDashboardData();
  }, []);

  const totalActiveItems =
    metrics.find((m) => m.title === "In Progress")?.value || 0;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Memuat Dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tidak ada UI Filter di sini */}

      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Tidak ada tombol Unduh Laporan di sini */}

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Permintaan Aktif (Top 5)
          </h2>
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
            Lihat Semua ({totalActiveItems} Item)
          </button>
        </div>

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
              {activeRequests.map((req) => (
                <tr
                  key={req.request_id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.designer ? req.designer.full_name : "Belum Ditugaskan"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.deadline).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {activeRequests.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada permintaan aktif saat ini.
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

export default DashboardContent;
