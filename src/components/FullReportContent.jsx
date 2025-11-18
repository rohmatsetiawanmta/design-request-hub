// src/components/FullReportContent.jsx

import React, { useState, useEffect, useMemo } from "react";
import MetricCard from "./MetricCard";
import {
  fetchDashboardData,
  fetchActiveRequestsForTable,
  fetchDesigners,
  fetchRevisionCounts, // Diimpor untuk analisis revisi
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

const FullReportContent = () => {
  const [metrics, setMetrics] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [designersList, setDesignersList] = useState([]);
  const [allRequestsData, setAllRequestsData] = useState([]);
  const [revisionEvents, setRevisionEvents] = useState([]); // State untuk hitungan event revisi
  const [filters, setFilters] = useState({
    category: "All",
    designerId: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ["All", "Graphic", "Motion", "Game UI", "Other"];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // FUNGSI: Export Data ke CSV
  const exportToCsv = (data, filename) => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "request_id",
      "title",
      "category",
      "deadline",
      "status",
      "designer_name",
    ];

    const rows = data.map((req) => [
      req.request_id,
      req.title,
      req.category,
      new Date(req.deadline).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      req.status,
      req.designers ? req.designers.full_name : "Belum Ditugaskan",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((e) => e.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
        detail: "Total permintaan yang sesuai filter",
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

  // FUNGSI ANALISIS BARU - Menggunakan data allRequestsData dan revisionEvents
  const analysisData = useMemo(() => {
    const totalRequests = allRequestsData.length;
    const requestsInWorkflow = allRequestsData.filter((r) => r.designer_id);

    // 1. Hitung Revision Rate Global (Rata-rata Revisi per Request)
    const totalRevisionEvents = revisionEvents.length;
    const avgRevisionsPerRequest =
      totalRequests > 0 ? totalRevisionEvents / totalRequests : 0;

    // 2. Workload & Completion by Designer
    const designerStats = designersList
      .map((designer) => {
        const tasks = requestsInWorkflow.filter(
          (r) => r.designer_id === designer.id
        );
        const completed = tasks.filter((r) => r.status === "Completed").length;
        const total = tasks.length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return {
          name: designer.full_name,
          totalTasks: total,
          completedTasks: completed,
          completionRate: completionRate.toFixed(1),
        };
      })
      .sort((a, b) => b.totalTasks - a.totalTasks);

    // 3. Status Breakdown by Category
    const categoryStats = categories
      .filter((c) => c !== "All")
      .map((category) => {
        const categoryRequests = allRequestsData.filter(
          (r) => r.category === category
        );
        const total = categoryRequests.length;

        // Menghitung peristiwa revisi HANYA untuk request di kategori ini
        const revisionCount = revisionEvents.filter(
          (e) =>
            allRequestsData.find((r) => r.request_id === e.request_id)
              ?.category === category
        ).length;

        const avgRevisionsPerRequestCat = total > 0 ? revisionCount / total : 0;

        return {
          category,
          total,
          avgRevisionsPerRequest: avgRevisionsPerRequestCat.toFixed(2),
          completionRate: (
            (categoryRequests.filter((r) => r.status === "Completed").length /
              total) *
              100 || 0
          ).toFixed(1),
        };
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      avgRevisionsPerRequest: avgRevisionsPerRequest.toFixed(2),
      designerStats,
      categoryStats,
    };
  }, [allRequestsData, designersList, revisionEvents]);
  // END FUNGSI ANALISIS BARU

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil daftar desainer (untuk filter & analisis)
      const designerData = await fetchDesigners();
      setDesignersList(designerData);

      // 2. Ambil data dashboard DENGAN filter
      const allRequests = await fetchDashboardData(filters);

      // 3. Ambil data REVISI dari tabel feedback
      const revisions = await fetchRevisionCounts(filters);
      setRevisionEvents(revisions); // Menyimpan event revisi

      const activeTableData = await fetchActiveRequestsForTable();

      setMetrics(calculateMetrics(allRequests));
      setAllRequestsData(allRequests);
      setActiveRequests(activeTableData);
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
      setError(
        "Gagal memuat data laporan. Pastikan koneksi Supabase & tabel terkonfigurasi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [
    filters.category,
    filters.designerId,
    filters.startDate,
    filters.endDate,
  ]);

  const totalActiveItems =
    metrics.find((m) => m.title === "In Progress")?.value || 0;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Memuat Laporan & Analisis...
      </div>
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
      {/* UI Filter (UC-11) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Filter Laporan & Analisis
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Kategori
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Desainer
            </label>
            <select
              name="designerId"
              value={filters.designerId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Semua Desainer</option>
              {designersList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Dari Tanggal Dibuat
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sampai Tanggal Dibuat
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  category: "All",
                  designerId: "",
                  startDate: "",
                  endDate: "",
                })
              }
              className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
      {/* End UI Filter */}

      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* BAGIAN ANALISIS EFISIENSI BARU */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Analisis Efisiensi & Kualitas
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Analisis 1: Average Revisions per Request */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl col-span-1">
            <p className="text-sm font-medium text-red-600">
              Rata-rata Revisi per Request
            </p>
            <h3 className="text-3xl font-bold text-red-800 mt-1">
              {analysisData.avgRevisionsPerRequest}x
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Beban kerja Revisi (Event Revisi / Total Request).
            </p>
          </div>

          {/* Analisis 2: Breakdown by Category */}
          <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Rata-rata Revisi per Kategori
            </p>
            <div className="space-y-1">
              {analysisData.categoryStats.map((stat) => (
                <div
                  key={stat.category}
                  className="flex justify-between text-sm"
                >
                  <span className="font-medium">
                    {stat.category} ({stat.total} Req)
                  </span>
                  <span
                    className={`font-bold ${
                      stat.avgRevisionsPerRequest > 1.5
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {stat.avgRevisionsPerRequest}x
                  </span>
                </div>
              ))}
              {analysisData.categoryStats.length === 0 && (
                <p className="text-xs italic text-gray-500">
                  Tidak ada data Kategori yang ditugaskan dalam filter ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analisis 3: Workload & Completion by Designer */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Workload & Completion Rate by Designer
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Designer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Total Tasks Assigned
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Completed Tasks
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisData.designerStats.map((stat, index) => (
                  <tr
                    key={stat.name}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {stat.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {stat.totalTasks}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {stat.completedTasks}
                    </td>
                    <td
                      className={`px-4 py-2 text-sm font-semibold ${
                        stat.completionRate >= 80
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {stat.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysisData.designerStats.length === 0 && (
            <p className="text-sm italic text-gray-500 pt-3">
              Tidak ada desainer yang ditugaskan dalam rentang filter ini.
            </p>
          )}
        </div>
      </div>
      {/* END BAGIAN ANALISIS EFISIENSI BARU */}

      {/* Tombol Unduh Laporan */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() =>
            exportToCsv(
              allRequestsData,
              `Report_DesignHub_${new Date().toISOString().slice(0, 10)}.csv`
            )
          }
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || allRequestsData.length === 0}
        >
          Unduh Laporan Data Mentah ({allRequestsData.length} Item)
        </button>
      </div>

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

export default FullReportContent;
