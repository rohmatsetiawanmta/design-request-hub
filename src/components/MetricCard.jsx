import React from "react";

const MetricCard = ({ title, value, detail, color = "purple" }) => {
  // Peta kelas Tailwind CSS untuk styling berdasarkan prop 'color'
  const colorClasses = {
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    green: "text-green-600 bg-green-50 border-green-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
  };

  return (
    // Menggunakan kelas dinamis untuk border dan background berdasarkan warna
    <div className={`p-6 rounded-xl shadow-md border ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600 uppercase mb-1">
        {title}
      </p>
      <h2 className="text-4xl font-bold">{value}</h2>
      <p className="text-xs mt-2 font-medium text-gray-500">{detail}</p>
    </div>
  );
};

export default MetricCard;
