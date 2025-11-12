import React, { useState, useEffect } from "react";
import { fetchMyTasks } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import { Upload } from "lucide-react";
import UploadDesignModal from "./UploadDesignModal";

const getStatusColor = (status) => {
  switch (status) {
    case "Submitted":
      return "bg-yellow-100 text-yellow-800";
    case "Approved":
      return "bg-purple-100 text-purple-800";
    case "In Progress":
      return "bg-purple-100 text-purple-800";
    case "Revision":
      return "bg-red-100 text-red-800";
    case "For Review":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [selectedTaskToUpload, setSelectedTaskToUpload] = useState(null);

  const designerId = user?.id;

  const loadTasks = async () => {
    if (!designerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTasks(designerId);
      setTasks(data);
    } catch (err) {
      console.error("Gagal memuat tugas:", err);
      setError(
        "Gagal memuat daftar tugas Anda. Pastikan Anda terdaftar sebagai Designer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [designerId]);

  const handleUploadSuccess = (message) => {
    setInfoMsg(message);
    loadTasks();
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Memuat daftar tugas...
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

  const tasksReadyForUpload = tasks.filter(
    (t) => t.status === "Approved" || t.status === "Revision"
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Tugas Saya ({tasksReadyForUpload.length} Aktif)
      </h1>
      <p className="mb-6 text-gray-600">
        Daftar permintaan yang ditugaskan kepada Anda (Status: Approved atau
        Revision).
      </p>

      {infoMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {infoMsg}
        </div>
      )}

      {tasksReadyForUpload.length === 0 ? (
        <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-lg">
          Tidak ada tugas desain aktif saat ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permintaan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenggat
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasksReadyForUpload.map((task) => (
                <tr key={task.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {task.title}
                    <div className="text-xs text-gray-500">{task.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.requester ? task.requester.full_name : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.deadline).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTaskToUpload(task)}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50 inline-flex items-center space-x-1"
                      title="Unggah Hasil Desain"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Unggah</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTaskToUpload && (
        <UploadDesignModal
          task={selectedTaskToUpload}
          onClose={() => setSelectedTaskToUpload(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default MyTasks;
