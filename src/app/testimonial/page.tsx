"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Heart,
  Sparkles,
  Send,
  Smile,
  ImageIcon,
  Film,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const signika = Signika({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface TestimonialItem {
  id: string;
  name: string;
  content: string;
  rating?: number;
  status?: "pending" | "approved";
  order?: number;
  cardColor?: string;
  teacherReply?: string;
}

interface ColorOption {
  id: string;
  bg: string;
  border: string;
  label: string;
}

interface GiphyItem {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
  };
}

const COLOR_OPTIONS: ColorOption[] = [
  { id: "rose", bg: "bg-rose-50", border: "border-rose-200", label: "Rose" },
  { id: "peach", bg: "bg-orange-50", border: "border-orange-200", label: "Peach" },
  { id: "mint", bg: "bg-emerald-50", border: "border-emerald-200", label: "Mint" },
  { id: "lavender", bg: "bg-purple-50", border: "border-purple-200", label: "Lavender" },
  { id: "sky", bg: "bg-sky-50", border: "border-sky-200", label: "Sky" },
  { id: "amber", bg: "bg-amber-50", border: "border-amber-200", label: "Amber" },
];

const E_MOJI_LIST = [
  "😊", "✨", "💖", "👏", "🎉", "🔥", "🌟", "😍", "👍", "🙌", "🥰", "💡", "🎯", "🏆", "❤️"
];

// Helper untuk Render Teks + Gambar/Sticker/GIF
const renderContentWithMedia = (text: string) => {
  const mediaRegex = /!\[media\]\((.*?)\)/g;
  const parts = text.split(mediaRegex);

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <img
          key={index}
          src={part}
          alt="Sticker/GIF"
          className="max-w-[140px] max-h-[140px] object-contain my-2 rounded-xl shadow-xs border border-slate-100 mx-auto"
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function TestimonialPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [selectedColor, setSelectedColor] = useState("rose");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorWarning, setErrorWarning] = useState("");

  // Media Picker State
  const [activePickerTab, setActivePickerTab] = useState<"emoji" | "sticker" | "gif" | null>(null);
  const [customGifUrl, setCustomGifUrl] = useState("");
  const [giphyQuery, setGiphyQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState<GiphyItem[]>([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);

  // Ambil data testimonial dari Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "testimonials"),
      (snapshot) => {
        const fetchedData: TestimonialItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status === "approved" || !data.status) {
            fetchedData.push({
              id: docSnap.id,
              name: data.name || "Anonim",
              content: data.content || "",
              rating: data.rating || 5,
              cardColor: data.cardColor || "rose",
              teacherReply: data.teacherReply || "",
              order: data.order || 0,
            } as TestimonialItem);
          }
        });
        fetchedData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setTestimonials(fetchedData);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // Fetch Giphy API
  useEffect(() => {
    if (!giphyQuery || (activePickerTab !== "sticker" && activePickerTab !== "gif")) {
      setGiphyResults([]);
      return;
    }

    const fetchGiphy = async () => {
      setIsGiphyLoading(true);
      try {
        const type = activePickerTab === "sticker" ? "stickers" : "gifs";
        const res = await fetch(
          `https://api.giphy.com/v1/${type}/search?api_key=GlVGYHriVEOauw2K09jE0xQ3nCS9GJge&q=${encodeURIComponent(
            giphyQuery
          )}&limit=8`
        );
        const data = await res.json();
        setGiphyResults(data.data || []);
      } catch (err) {
        console.error("Gagal memuat Giphy:", err);
      } finally {
        setIsGiphyLoading(false);
      }
    };

    const timer = setTimeout(fetchGiphy, 400);
    return () => clearTimeout(timer);
  }, [giphyQuery, activePickerTab]);

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const addMediaUrl = (url: string) => {
    setContent((prev) => `${prev} ![media](${url}) `);
    setActivePickerTab(null);
    setGiphyQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWarning("");
    setSuccessMessage("");

    // 1. Cooldown 5 menit via localStorage
    const COOLDOWN_TIME = 5 * 60 * 1000;
    const lastSubmitTime = localStorage.getItem("last_testimonial_time");
    const now = Date.now();

    if (lastSubmitTime && now - Number(lastSubmitTime) < COOLDOWN_TIME) {
      const remainingMs = COOLDOWN_TIME - (now - Number(lastSubmitTime));
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      setErrorWarning(
        `Mohon tunggu sekitar ${remainingMinutes} menit lagi sebelum mengirim testimonial berikutnya ya! 🙏`
      );
      return;
    }

    // 2. Validasi minimal 15 karakter
    if (content.trim().length < 15) {
      setErrorWarning("Testimonial terlalu pendek. Tuliskan minimal 15 karakter ya!");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "testimonials"), {
        name: name.trim() || "Anonim",
        content: content.trim(),
        rating,
        cardColor: selectedColor,
        status: "pending", // Masuk ke antrean admin terlebih dahulu
        createdAt: serverTimestamp(),
        order: Date.now(),
      });

      localStorage.setItem("last_testimonial_time", String(now));
      setSuccessMessage(
        "Yeay! Testimonial berhasil dikirim dan akan segera ditampilkan setelah disetujui Miss Ken. ✨"
      );
      setName("");
      setContent("");
      setRating(5);
    } catch (err) {
      console.error("Gagal mengirim testimonial:", err);
      setErrorWarning("Terjadi kesalahan sistem, silakan coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${signika.className} min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 selection:bg-rose-300 selection:text-white pb-24`}
    >
      {/* NAVBAR / HEADER */}
      <div className="max-w-5xl mx-auto mb-10 flex items-center justify-between bg-white p-4 md:px-8 rounded-full shadow-sm border border-slate-100">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm hover:text-rose-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
        <div className={`${playfair.className} font-bold text-xl text-rose-500 italic`}>
          Keluy.
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-16">
        {/* JUDUL HALAMAN */}
        <div className="text-center max-w-xl mx-auto">
          <span className="text-rose-500 tracking-[0.3em] text-xs font-bold uppercase mb-2 inline-block">
            TESTIMONIAL KELUY
          </span>
          <h1
            className={`${playfair.className} text-3xl md:text-5xl text-rose-950 font-bold mb-3`}
          >
            Semua Testimonial Murid
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Kumpulan pengalaman belajar dan kesan dari murid-murid hebat di Keluy English Club.
          </p>
        </div>

        {/* DAFTAR TESTIMONIAL (TANPA TANGGAL) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-rose-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Memuat testimonial...</span>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-rose-100 shadow-sm max-w-md mx-auto">
            <Star className="w-10 h-10 text-rose-300 mx-auto mb-3" />
            <h3 className={`${playfair.className} text-xl font-bold text-rose-950 mb-1`}>
              Belum Ada Testimonial
            </h3>
            <p className="text-slate-500 text-xs">Jadilah yang pertama menuliskan ulasan!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item) => {
              const styleColor = COLOR_OPTIONS.find((c) => c.id === item.cardColor) || COLOR_OPTIONS[0];

              return (
                <div
                  key={item.id}
                  className={`${styleColor.bg} border-2 ${styleColor.border} rounded-3xl p-5 shadow-sm relative flex flex-col justify-between transition hover:shadow-md w-full overflow-hidden`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 pr-2">
                      <div className="overflow-hidden">
                        <h3
                          className={`${playfair.className} font-bold text-base text-rose-950 leading-tight truncate`}
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 mb-3 text-amber-400">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <div className="text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-line break-words overflow-hidden">
                      {renderContentWithMedia(item.content)}
                    </div>
                  </div>

                  {item.teacherReply && (
                    <div className="mt-2 pt-3 border-t border-slate-200/60 bg-white/70 p-3 rounded-2xl border border-rose-100 overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> Balasan Miss Ken:
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed break-words">
                        "{item.teacherReply}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* FORM KIRIM TESTIMONIAL BARU */}
        <div className="bg-white border border-rose-100 rounded-[2.5rem] p-6 md:p-10 shadow-lg relative max-w-2xl mx-auto mt-20">
          <h2
            className={`${playfair.className} text-2xl font-bold text-rose-950 mb-6 flex items-center gap-2`}
          >
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Tulis Testimonial Baru
          </h2>

          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-2xl flex items-center justify-between animate-in fade-in">
              <span className="font-medium">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorWarning && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm p-4 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorWarning}</div>
              <button
                onClick={() => setErrorWarning("")}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Pengirim{" "}
                <span className="text-slate-400 font-normal">(Opsional — Kosongkan untuk Anonim)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kak Budi / Mama Alifa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rating Belajar
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition transform hover:scale-110 focus:outline-none"
                  >
                    <span
                      className={`text-2xl ${
                        star <= rating ? "text-amber-400" : "text-slate-200"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pesan Testimonial <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePickerTab(activePickerTab === "emoji" ? null : "emoji")
                    }
                    className={`text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 ${
                      activePickerTab === "emoji"
                        ? "bg-rose-500 text-white"
                        : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" /> Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePickerTab(activePickerTab === "sticker" ? null : "sticker");
                      setGiphyQuery("");
                    }}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 ${
                      activePickerTab === "sticker"
                        ? "bg-purple-500 text-white"
                        : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Sticker
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePickerTab(activePickerTab === "gif" ? null : "gif");
                      setGiphyQuery("");
                    }}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 ${
                      activePickerTab === "gif"
                        ? "bg-sky-500 text-white"
                        : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" /> GIF
                  </button>
                </div>
              </div>

              {activePickerTab === "emoji" && (
                <div className="mb-3 p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-wrap gap-2 animate-in fade-in">
                  {E_MOJI_LIST.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="text-xl p-1.5 hover:bg-white rounded-xl transition transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {(activePickerTab === "sticker" || activePickerTab === "gif") && (
                <div className="mb-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3 animate-in fade-in">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={`Cari ${
                        activePickerTab === "sticker" ? "Sticker" : "GIF"
                      } di Giphy...`}
                      value={giphyQuery}
                      onChange={(e) => setGiphyQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {isGiphyLoading ? (
                    <div className="flex items-center justify-center py-6 text-rose-500 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-medium">Mencari di Giphy...</span>
                    </div>
                  ) : giphyResults.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                      {giphyResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addMediaUrl(item.images.fixed_height.url)}
                          className="bg-white rounded-xl border border-slate-100 p-1 hover:scale-105 transition hover:shadow-md focus:outline-none overflow-hidden h-24 flex items-center justify-center"
                        >
                          <img
                            src={item.images.fixed_height.url}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 space-y-2 border-t border-slate-200/60 pt-3">
                      <p className="text-slate-500 text-xs">
                        Atau masukkan URL gambar/GIF secara langsung:
                      </p>
                      <div className="flex gap-2 max-w-md mx-auto">
                        <input
                          type="url"
                          placeholder="https://.../gambar.gif"
                          value={customGifUrl}
                          onChange={(e) => setCustomGifUrl(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customGifUrl) {
                              addMediaUrl(customGifUrl);
                              setCustomGifUrl("");
                            }
                          }}
                          className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-rose-600 transition"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <textarea
                required
                rows={4}
                placeholder="Tuliskan pengalaman belajarmu, suasana kelas, atau masukan untuk Miss Ken di sini (minimal 15 karakter)..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errorWarning) setErrorWarning("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Warna Tampilan Kartu
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {COLOR_OPTIONS.map((col) => {
                  const isSelected = selectedColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      className={`${col.bg} ${col.border} border-2 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? "ring-2 ring-rose-500 scale-105 shadow-sm"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700">{col.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl hover:bg-rose-600 transition shadow-md flex items-center justify-center gap-2 text-base disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Mengirim Testimonial...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Kirim Testimonial
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
