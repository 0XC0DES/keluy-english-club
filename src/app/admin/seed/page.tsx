"use client";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SeedAdminPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setIsLoading(true);

    // Format username menjadi email internal Firebase
    const cleanUsername = username.trim().toLowerCase();
    const formattedEmail = cleanUsername.includes("@")
      ? cleanUsername
      : `${cleanUsername}@keluyenglish.com`;

    try {
      await createUserWithEmailAndPassword(auth, formattedEmail, password);
      setStatus(
        `✅ BERHASIL! Akun admin '${cleanUsername}' telah dibuat. Segera hapus file ini!`,
      );
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setStatus("⚠️ Username/Email ini sudah terdaftar sebelumnya.");
      } else {
        setStatus(`❌ Gagal: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-1">
          Buat Akun Admin Pertama
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Halaman temporer sekali pakai untuk mendaftarkan akun admin.
        </p>

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Username Admin
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password kuat"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-600 transition text-sm disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Buat Akun Admin"}
          </button>
        </form>

        {status && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 leading-relaxed">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
