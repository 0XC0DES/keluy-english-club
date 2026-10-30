"use client";
import React from "react";
import {
  Star,
  Sparkles,
  MoreVertical,
  Play,
  Flag,
  MessageSquare,
  ExternalLink,
  Smile,
  Loader2,
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

interface TestimonialPost {
  id: string;
  name: string;
  content: string;
  cardColor: string;
  rating: number;
  createdAt?: string;
  teacherReply?: string;
  replyDate?: string;
  status?: string;
}

interface ColorOption {
  id: string;
  bg: string;
  border: string;
  label: string;
}

export default function TestimonialList({
  testimonials,
  isLoading,
  COLOR_OPTIONS,
  renderContentWithMedia,
  activeMenuId,
  setActiveMenuId,
  setDetailModalPost,
  setSlideshowIndex,
  setReportSuccess,
}: any) {
  const getColorStyle = (colorId: string) => {
    return (
      COLOR_OPTIONS.find((c: ColorOption) => c.id === colorId) ||
      COLOR_OPTIONS[0]
    );
  };

  return (
    <div className={`${signika.className} space-y-6`}>
      <div className="flex justify-between items-center">
        <h2
          className={`${playfair.className} text-2xl font-bold text-rose-950`}
        >
          Semua Testimonial ({testimonials.length})
        </h2>
        {testimonials.length > 0 && (
          <button
            onClick={() => setSlideshowIndex(0)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-full hover:bg-rose-50 shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 fill-rose-600" /> Putar Slideshow
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-rose-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">
            Memuat daftar testimonial...
          </span>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-rose-100 p-12 text-center text-slate-500">
          <Smile className="w-10 h-10 text-rose-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 mb-1">Belum Ada Testimonial</p>
          <p className="text-xs">
            Jadilah yang pertama untuk membagikan cerita dan kesan belajarmu!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {testimonials.map((item: TestimonialPost, index: number) => {
            const colorStyle = getColorStyle(item.cardColor);
            return (
              <div
                key={item.id}
                // Ditambahkan w-full dan overflow-hidden agar card terkunci ukurannya dan tidak melebar
                className={`${colorStyle.bg} border-2 ${colorStyle.border} rounded-3xl p-4 shadow-sm relative flex flex-col justify-between transition hover:shadow-md w-full overflow-hidden`}
              >
                <div className="w-full overflow-hidden">
                  <div className="flex justify-between items-start mb-3 pr-5">
                    <div className="overflow-hidden">
                      <h3
                        className={`${playfair.className} font-bold text-sm text-rose-950 leading-tight truncate`}
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {item.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() =>
                        setActiveMenuId(
                          activeMenuId === item.id ? null : item.id,
                        )
                      }
                      className="p-1 rounded-full hover:bg-white/80 transition text-slate-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === item.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-rose-100 rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => {
                            setDetailModalPost(item);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 border-b border-slate-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                          1. Buka Postingan{" "}
                          {item.teacherReply ? "(Ada Balasan)" : ""}
                        </button>

                        <a
                          href={`/testimonial?id=${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenuId(null)}
                          className="w-full text-left px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 border-b border-slate-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                          2. Buka di Tab Baru
                        </a>

                        <button
                          onClick={() => {
                            setSlideshowIndex(index);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 border-b border-slate-50"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          3. Mulai Slideshow
                        </button>

                        <button
                          onClick={() => {
                            setReportSuccess(true);
                            setActiveMenuId(null);
                            setTimeout(() => setReportSuccess(false), 3000);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Flag className="w-3.5 h-3.5 text-rose-500" />
                          4. Laporkan Postingan
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 mb-2 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Ditambahkan break-words agar teks panjang otomatis turun ke bawah */}
                  <div className="text-slate-700 text-xs leading-relaxed mb-3 whitespace-pre-line break-words overflow-hidden">
                    {renderContentWithMedia(item.content)}
                  </div>
                </div>

                {item.teacherReply && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 bg-white/60 p-2.5 rounded-xl border border-rose-100 overflow-hidden">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mb-0.5">
                      <Sparkles className="w-3 h-3" /> Balasan Miss Ken:
                    </div>
                    <p className="text-[10px] text-slate-600 italic leading-tight break-words">
                      "{item.teacherReply}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
