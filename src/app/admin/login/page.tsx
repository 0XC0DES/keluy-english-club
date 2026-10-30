"use client";
import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const signika = Signika({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // Konversi Username menjadi Format Email Internal Firebase
    const cleanUsername = username.trim().toLowerCase();
    const formattedEmail = cleanUsername.includes("@")
      ? cleanUsername
      : `${cleanUsername}@keluyenglish.com`;

    try {
      await signInWithEmailAndPassword(auth, formattedEmail, password);
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Gagal Login Admin:", error.code);

      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setErrorMessage("Username atau kata sandi tidak sesuai.");
          break;
        case "auth/too-many-requests":
          setErrorMessage(
            "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.",
          );
          break;
        default:
          setErrorMessage(
            "Gagal masuk. Periksa kembali koneksi internet dan akun Anda.",
          );
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${signika.className} min-h-screen bg-slate-50/80 text-slate-800 flex flex-col justify-between p-4 md:p-8 selection:bg-rose-300 selection:text-white`}
    >
      {/* NAVIGATION BAR ATAS */}
      <header className="max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-full font-bold text-xs border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>
      </header>

      {/* CARD LOGIN */}
      <main className="max-w-md w-full mx-auto bg-white border border-slate-200/80 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-rose-500/5 my-auto">
        <div className="text-center mb-8">
          <h1
            className={`${playfair.className} font-bold text-4xl text-rose-500 italic mb-1`}
          >
            Keluy.
          </h1>
          <span className="text-rose-600 text-xs font-bold uppercase tracking-widest block mb-2">
            Portal Admin
          </span>
          <p className="text-slate-500 text-xs md:text-sm">
            Masuk untuk mengelola jadwal kelas dan testimonial.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan username admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-2xl pl-4 pr-11 py-3.5 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-2xl hover:bg-rose-600 active:scale-[0.99] transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-slate-400">
        © 2026 Keluy English Club
      </footer>
    </div>
  );
}
