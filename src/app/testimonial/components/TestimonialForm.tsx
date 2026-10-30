"use client";
import React from "react";
import {
  Sparkles,
  Send,
  Smile,
  ImageIcon,
  Film,
  Loader2,
  Heart,
  Search,
  Check,
  X,
} from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const signika = Signika({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

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

interface TestimonialFormProps {
  name: string;
  setName: (val: string) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  selectedColor: string;
  setSelectedColor: (val: string) => void;
  rating: number;
  setRating: (val: number) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  successMessage: string;
  setSuccessMessage: (val: string) => void;
  activePickerTab: "emoji" | "sticker" | "gif" | null;
  setActivePickerTab: (tab: "emoji" | "sticker" | "gif" | null) => void;
  customGifUrl: string;
  setCustomGifUrl: (val: string) => void;
  giphyQuery: string;
  setGiphyQuery: (val: string) => void;
  giphyResults: GiphyItem[];
  isGiphyLoading: boolean;
  addEmoji: (emoji: string) => void;
  addMediaUrl: (url: string) => void;
  COLOR_OPTIONS: ColorOption[];
  EMOJI_LIST: string[];
  setRatingStars: any; // kalau ada
}

export default function TestimonialForm({
  name,
  setName,
  content,
  setContent,
  selectedColor,
  setSelectedColor,
  rating,
  setRating,
  isSubmitting,
  handleSubmit,
  successMessage,
  setSuccessMessage,
  activePickerTab,
  setActivePickerTab,
  customGifUrl,
  setCustomGifUrl,
  giphyQuery,
  setGiphyQuery,
  giphyResults,
  isGiphyLoading,
  addEmoji,
  addMediaUrl,
  COLOR_OPTIONS,
  EMOJI_LIST,
}: any) {
  return (
    <div
      className={`${signika.className} bg-white border border-rose-100 rounded-[2.5rem] p-6 md:p-10 shadow-lg relative`}
    >
      <h2
        className={`${playfair.className} text-2xl font-bold text-rose-950 mb-6 flex items-center gap-2`}
      >
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Tulis
        Testimonial Baru
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Nama */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nama Pengirim{" "}
            <span className="text-slate-400 font-normal">
              (Opsional — Kosongkan untuk Anonim)
            </span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Kak Budi / Mama Alifa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
          />
        </div>

        {/* Input Rating Bintang */}
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

        {/* Input Pesan + Picker Tool */}
        <div className="relative">
          <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pesan Testimonial <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setActivePickerTab(
                    activePickerTab === "emoji" ? null : "emoji",
                  )
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
                  setActivePickerTab(
                    activePickerTab === "sticker" ? null : "sticker",
                  );
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

          {/* Tab 1: Emoji Picker */}
          {activePickerTab === "emoji" && (
            <div className="mb-3 p-3 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
              {EMOJI_LIST.map((emoji: string, idx: number) => (
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

          {/* Tab 2 & 3: Giphy Picker */}
          {(activePickerTab === "sticker" || activePickerTab === "gif") && (
            <div className="mb-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3 animate-in fade-in zoom-in-95">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={`Cari ${activePickerTab === "sticker" ? "Sticker" : "GIF"} di Giphy...`}
                  value={giphyQuery}
                  onChange={(e) => setGiphyQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {isGiphyLoading ? (
                <div className="flex items-center justify-center py-8 text-rose-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">
                    Mencari di Giphy...
                  </span>
                </div>
              ) : giphyResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                  {giphyResults.map((item: GiphyItem) => (
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
                    Atau masukkan URL gambar/GIF secara langsung di bawah ini:
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
            placeholder="Tuliskan pengalaman belajarmu, suasana kelas, atau masukan untuk Miss Ken di sini..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
          ></textarea>
        </div>

        {/* Pilihan Warna Soft Card */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Warna Tampilan Kartu
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {COLOR_OPTIONS.map((col: ColorOption) => {
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
                  <span className="text-xs font-bold text-slate-700">
                    {col.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tombol Kirim */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl hover:bg-rose-600 transition shadow-md flex items-center justify-center gap-2 text-base disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Mengirim
              Testimonial...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> Kirim Testimonial
            </>
          )}
        </button>
      </form>
    </div>
  );
}
