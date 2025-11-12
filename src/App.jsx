import React, { useState } from "react";
import { useAuth } from "./AuthContext";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardContent from "./components/DashboardContent";
import LoginForm from "./components/LoginForm";
import CreateRequestForm from "./components/CreateRequestForm";
import MyRequests from "./components/MyRequests";

const App = () => {
  const { session, loading } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  if (loading) {
    return null;
  }

  if (!session) {
    return <LoginForm />;
  }

  const headerTitle = activeMenu.includes("Permintaan Baru")
    ? "Buat Permintaan Desain"
    : activeMenu.includes("Daftar Permintaan")
    ? "Daftar Permintaan Saya"
    : activeMenu.includes("Persetujuan")
    ? "Daftar Persetujuan"
    : activeMenu;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="ml-64 flex-1">
        <Header title={headerTitle} />

        <main className="p-8 pt-24">
          {activeMenu === "Dashboard" && <DashboardContent />}

          {activeMenu === "Buat Permintaan Baru" && <CreateRequestForm />}

          {activeMenu === "Daftar Permintaan Saya" && <MyRequests />}

          {activeMenu !== "Dashboard" &&
            activeMenu !== "Buat Permintaan Baru" &&
            activeMenu !== "Daftar Permintaan Saya" && (
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
        </main>
      </div>
    </div>
  );
};

export default App;
