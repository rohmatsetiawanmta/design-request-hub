import React from "react";
import { X, Bot, User } from "lucide-react";

const AssignmentChoiceModal = ({
  request,
  onClose,
  onChooseAuto,
  onChooseManual,
  loading,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-xl font-bold">Pilih Metode Penugasan</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-700">
          Permintaan: <strong>{request.title}</strong>
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Pilih metode untuk menugaskan Desainer.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onChooseAuto(request.request_id)}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Bot className="w-5 h-5 mr-2" />
            {loading ? "Mencari..." : "Auto Assign"}
          </button>

          <button
            onClick={() => onChooseManual(request)}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            Penugasan Manual
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentChoiceModal;
