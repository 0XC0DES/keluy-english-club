"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Flag,
  Play,
  MessageSquare,
} from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import TestimonialList from "./components/TestimonialList";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const signika = Signika({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const COLOR_OPTIONS = [
  {
    id: "rose",
    bg: "bg-rose-50",
    border: "border-rose-200",
    label: "Soft Rose",
  },
  {
    id: "peach",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Soft Peach",
  },
  {
    id: "mint",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Soft Mint",
  },
  {
    id: "lavender",
    bg: "bg-purple-50",
    border: "border-purple-200",
    label: "Soft Lavender",
  },
  { id: "sky", bg: "bg-sky-50", border: "border-sky-200", label: "Soft Sky" },
  {
    id: "amber",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Soft Yellow",
  },
];

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

export default function TestimonialListPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [detailModalPost, setDetailModalPost] = useState<any | null>(null);
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      let q;
      try {
        q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
      } catch {
        q = collection(db, "testimonials");
      }
      const snapshot = await getDocs(q);
      const fetched: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === "pending") return;

        let formattedDate = "Baru saja";
        if (data.createdAt?.toDate) {
          formattedDate = data.createdAt.toDate().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        } else if (data.dateString) {
          formattedDate = data.dateString;
        }

        fetched.push({
          id: docSnap.id,
          name: data.name || "Anonim",
          content: data.content || "",
          cardColor: data.cardColor || "rose",
          rating: data.rating || 5,
          createdAt: formattedDate,
          teacherReply: data.teacherReply || "",
          replyDate: data.replyDate || "",
          status: data.status || "approved",
        });
      });
      setTestimonials(fetched);
    } catch (err) {
      console.error("Gagal mengambil data testimonial:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return (
    <div
      className={`${signika.className} min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 selection:bg-rose-300 selection:text-white pb-24`}
    >
      {/* NAVBAR */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-4 px-6 rounded-full shadow-sm border border-slate-100">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-rose-500 font-bold text-sm hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
        <Link
          href="/testimonial/add"
          className="bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-rose-600 transition shadow-sm flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" /> Tulis Testimonial
        </Link>
      </div>

      {/* KONTROL LEBAR UTAMA: Menggunakan max-w-7xl agar 6 kolom proporsional */}
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-xl mx-auto">
          <span className="bg-rose-100 text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-2 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Cerita Murid
          </span>
          <h1
            className={`${playfair.className} text-3xl md:text-5xl font-bold text-rose-950 mb-3`}
          >
            Suara Murid & Orang Tua
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Kumpulan pengalaman dan kesan belajar bersama Miss Ken di Keluy
            English Club.
          </p>
        </div>

        {/* LIST KOMPONEN */}
        <TestimonialList
          testimonials={testimonials}
          isLoading={isLoading}
          COLOR_OPTIONS={COLOR_OPTIONS}
          renderContentWithMedia={renderContentWithMedia}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
          setDetailModalPost={setDetailModalPost}
          setSlideshowIndex={setSlideshowIndex}
          setReportSuccess={setReportSuccess}
        />
      </div>

      {/* NOTIFIKASI LAPORAN */}
      {reportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Flag className="w-4 h-4 text-rose-400" /> Postingan telah dilaporkan
          ke admin.
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalPost && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Ditambahkan overflow-hidden agar isi modal tidak keluar batas */}
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <button
              onClick={() => setDetailModalPost(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-1">
              Detail Testimonial
            </span>
            <h3
              className={`${playfair.className} text-2xl font-bold text-rose-950 mb-1 truncate`}
            >
              {detailModalPost.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {detailModalPost.createdAt}
            </p>
            <div className="flex items-center gap-1 mb-4 text-amber-400">
              {Array.from({ length: detailModalPost.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            {/* Ditambahkan break-words dan overflow-hidden di sini */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm mb-6 whitespace-pre-line break-words overflow-hidden">
              {renderContentWithMedia(detailModalPost.content)}
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 overflow-hidden">
              <span className="text-xs font-bold text-rose-600 block mb-1">
                Balasan Miss Ken
              </span>
              <p className="text-sm text-slate-700 italic break-words">
                {detailModalPost.teacherReply
                  ? `"${detailModalPost.teacherReply}"`
                  : "Belum ada balasan."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SLIDESHOW MODAL */}
      {slideshowIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full relative">
            <button
              onClick={() => setSlideshowIndex(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition flex items-center gap-1 text-sm font-bold"
            >
              Tutup <X className="w-5 h-5" />
            </button>
            {(() => {
              const currentItem = testimonials[slideshowIndex];
              const colorStyle =
                COLOR_OPTIONS.find((c) => c.id === currentItem.cardColor) ||
                COLOR_OPTIONS[0];
              return (
                <div
                  className={`${colorStyle.bg} border-2 ${colorStyle.border} rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden`}
                >
                  <div className="flex items-center justify-center gap-1 mb-4 text-amber-400">
                    {Array.from({ length: currentItem.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Ditambahkan w-full dan break-words agar teks slideshow terbungkus rapi */}
                  <div className="text-slate-800 text-lg md:text-2xl font-serif italic mb-6 flex flex-col items-center w-full break-words overflow-hidden">
                    {renderContentWithMedia(currentItem.content)}
                  </div>

                  <h3
                    className={`${playfair.className} font-bold text-2xl text-rose-950 mb-0.5 truncate`}
                  >
                    {currentItem.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentItem.createdAt}
                  </p>
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200/50">
                    <button
                      disabled={slideshowIndex === 0}
                      onClick={() =>
                        setSlideshowIndex((prev) =>
                          prev !== null ? Math.max(0, prev - 1) : 0,
                        )
                      }
                      className="p-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-rose-500 hover:text-white transition disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                      {slideshowIndex + 1} dari {testimonials.length}
                    </span>
                    <button
                      disabled={slideshowIndex === testimonials.length - 1}
                      onClick={() =>
                        setSlideshowIndex((prev) =>
                          prev !== null
                            ? Math.min(testimonials.length - 1, prev + 1)
                            : 0,
                        )
                      }
                      className="p-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-rose-500 hover:text-white transition disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
