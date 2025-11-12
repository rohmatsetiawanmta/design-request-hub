import React, { useState } from "react";
import { login } from "../supabaseClient";
import { useAuth } from "../AuthContext";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { setSession } = useAuth(); // Ambil fungsi untuk memperbarui sesi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Panggil fungsi login yang telah dibuat
      const { session, user } = await login(email, password);

      // Update Auth Context dengan sesi baru
      setSession(session);

      // Catatan: Supabase juga otomatis menyimpan sesi di Local Storage/Cookies
      console.log("Login berhasil:", user.email);
    } catch (error) {
      console.error("Login gagal:", error);
      // Tampilkan pesan error spesifik
      setErrorMsg(
        error.message || "Gagal login. Periksa email dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Design Request Hub Login
        </h2>
        <p className="text-center text-gray-500">
          Masuk untuk mengakses dashboard
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Input Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Input Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
