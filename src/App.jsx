// src/App.jsx (REFACTORED)

import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardContent from "./components/DashboardContent";
import FullReportContent from "./components/FullReportContent";
import LoginForm from "./components/LoginForm";
import CreateRequestForm from "./components/CreateRequestForm";
import MyRequests from "./components/MyRequests";
import ApprovalList from "./components/ApprovalList";
import MyTasks from "./components/MyTasks";
import UserManagement from "./components/UserManagement";
import AuditLogViewer from "./components/AuditLogViewer";
import ReassignManagement from "./components/ReassignManagement";

const InactiveAccountScreen = () => (
  <div className="p-20 text-center bg-white rounded-xl shadow-2xl border-4 border-red-300">
    <h1 className="text-4xl font-extrabold text-red-700 mb-4">
      ❌ Akun Nonaktif
    </h1>
    <p className="text-lg text-gray-700">
      Akses Anda ke sistem ini telah dinonaktifkan.
    </p>
    <p className="mt-3 text-red-500 font-medium">
      Harap hubungi Administrator atau Line Producer Anda untuk informasi lebih
      lanjut.
    </p>
  </div>
);

const App = () => {
  const { session, loading, userProfile } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // useEffect(() => {
  //   if (session) {
  //     setActiveMenu("Dashboard");
  //   }
  // }, [session]);

  if (loading) {
    return null;
  }

  if (!session) {
    return <LoginForm />;
  }

  const isInactive = userProfile && userProfile.is_active === false;

  const headerTitle = isInactive
    ? "Akses Terbatas"
    : activeMenu.includes("Permintaan Baru")
    ? "Buat Permintaan Desain"
    : activeMenu.includes("Daftar Permintaan")
    ? "Daftar Permintaan Saya"
    : activeMenu.includes("Persetujuan")
    ? "Daftar Persetujuan"
    : activeMenu.includes("Tugas Aktif")
    ? "Kelola Tugas Aktif Desainer"
    : activeMenu;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar
        activeMenu={isInactive ? "Dashboard" : activeMenu}
        setActiveMenu={setActiveMenu}
        isInactive={isInactive}
      />

      <div className="ml-64 flex-1">
        <Header title={headerTitle} />

        <main className="p-8 pt-24">
          {isInactive ? (
            <InactiveAccountScreen />
          ) : (
            <>
              {activeMenu === "Dashboard" && <DashboardContent />}
              {activeMenu === "Laporan & Analisis" && <FullReportContent />}
              {activeMenu === "Buat Permintaan Baru" && <CreateRequestForm />}
              {activeMenu === "Daftar Permintaan Saya" && <MyRequests />}
              {activeMenu === "Daftar Persetujuan" && <ApprovalList />}
              {activeMenu === "Kelola Tugas Aktif" && <ReassignManagement />}
              {activeMenu === "Tugas Saya" && <MyTasks />}
              {activeMenu === "Kelola Pengguna" && <UserManagement />}
              {activeMenu === "Log Audit" && <AuditLogViewer />}
              {activeMenu !== "Dashboard" &&
                activeMenu !== "Laporan & Analisis" &&
                activeMenu !== "Buat Permintaan Baru" &&
                activeMenu !== "Daftar Permintaan Saya" &&
                activeMenu !== "Daftar Persetujuan" &&
                activeMenu !== "Kelola Tugas Aktif" &&
                activeMenu !== "Tugas Saya" &&
                activeMenu !== "Kelola Pengguna" &&
                activeMenu !== "Log Audit" && (
                  <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-800">
                      Halaman {activeMenu}
                    </h1>
                    <p className="mt-4 text-gray-600">
                      Ini adalah area di mana fungsionalitas {activeMenu} akan
                      diimplementasikan.
                    </p>
                    <p className="mt-2 text-sm text-purple-500">
                      Peran saat ini:{" "}
                      {useAuth().userProfile?.role || "Tidak Ditemukan"}
                    </p>
                  </div>
                )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
