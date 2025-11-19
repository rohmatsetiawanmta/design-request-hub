import React, { useState, useEffect } from "react";
import {
  fetchActiveTasksForReassign,
  fetchDesigners,
  reassignDesigner,
} from "../supabaseClient";
import { ListOrdered, CornerDownRight } from "lucide-react";
import AssignDesignerModal from "./AssignDesignerModal";

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
    case "In Progress":
      return "bg-purple-100 text-purple-800";
    case "Revision":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ReassignManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [requestToReassign, setRequestToReassign] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const taskData = await fetchActiveTasksForReassign();
      const designerData = await fetchDesigners();

      setTasks(taskData);
      setDesigners(designerData);
    } catch (err) {
      console.error("Gagal memuat tugas aktif:", err);
      setError(
        "Gagal memuat daftar tugas aktif. Pastikan konfigurasi database sudah benar."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReassign = async (requestId, newDesignerId, oldDesignerId) => {
    setProcessingId(requestId);
    setRequestToReassign(null);
    setInfoMsg(null);

    try {
      await reassignDesigner(requestId, newDesignerId, oldDesignerId);

      const newDesignerName =
        designers.find((d) => d.id === newDesignerId)?.full_name || "Desainer";
      setInfoMsg(
        `Tugas berhasil dialihkan ke ${newDesignerName}. Notifikasi telah dikirim.`
      );

      loadData();
    } catch (error) {
      console.error("Gagal menugaskan ulang:", error);
      setError(`Gagal menugaskan ulang: ${error.message || error.toString()}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        Memuat daftar tugas aktif...
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
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <ListOrdered className="w-6 h-6" />
        <span>Kelola Tugas Aktif Desainer ({tasks.length})</span>
      </h1>
      <p className="mb-6 text-gray-600">
        Daftar semua permintaan yang sedang dikerjakan atau dalam siklus revisi.
        Gunakan fitur ini untuk mengalihkan tugas.
      </p>

      {infoMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {infoMsg}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="p-10 text-center text-gray-500 border-2 border-dashed rounded-lg">
          Tidak ada tugas aktif saat ini.
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ditugaskan Ke
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {task.title}
                    <div className="text-xs text-gray-500">
                      {task.category} / Tenggat:{" "}
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.requester ? task.requester.full_name : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.designer ? task.designer.full_name : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setRequestToReassign(task)}
                      disabled={processingId === task.request_id}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50 inline-flex items-center space-x-1"
                      title="Alihkan Tugas ke Designer Lain"
                    >
                      <CornerDownRight className="w-5 h-5" />
                      <span>Alihkan</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requestToReassign && (
        <AssignDesignerModal
          request={requestToReassign}
          designers={designers}
          loading={processingId === requestToReassign.request_id}
          onAssign={handleReassign}
          onCancel={() => setRequestToReassign(null)}
        />
      )}
    </div>
  );
};

export default ReassignManagement;
