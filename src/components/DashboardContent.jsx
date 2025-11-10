import React from "react";
import MetricCard from "./MetricCard";

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

const DashboardContent = () => {
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

export default DashboardContent;
