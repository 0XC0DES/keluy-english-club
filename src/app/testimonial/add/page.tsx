"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import TestimonialForm from "../components/TestimonialForm"; // Pastikan path komponen form sesuai

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const signika = Signika({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const GIPHY_API_KEY =
  process.env.NEXT_PUBLIC_GIPHY_API_KEY || "cwE032A8379f1wNo2x328aI1p25232";

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

const EMOJI_LIST = [
  "😊",
  "💖",
  "🌟",
  "📚",
  "✨",
  "🎉",
  "👏",
  "🥰",
  "🎯",
  "🔥",
  "💯",
  "🎓",
];

export default function AddTestimonialPage() {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("rose");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePickerTab, setActivePickerTab] = useState<
    "emoji" | "sticker" | "gif" | null
  >(null);
  const [customGifUrl, setCustomGifUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [giphyQuery, setGiphyQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);

  useEffect(() => {
    if (activePickerTab !== "gif" && activePickerTab !== "sticker") return;

    const fetchGiphyMedia = async () => {
      setIsGiphyLoading(true);
      try {
        const type = activePickerTab === "sticker" ? "stickers" : "gifs";
        const endpoint = giphyQuery.trim()
          ? `https://api.giphy.com/v1/${type}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(giphyQuery)}&limit=12`
          : `https://api.giphy.com/v1/${type}/trending?api_key=${GIPHY_API_KEY}&limit=12`;

        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();
        setGiphyResults(data.data || []);
      } catch (err) {
        console.error("Gagal terhubung ke Giphy:", err);
      } finally {
        setIsGiphyLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchGiphyMedia, 400);
    return () => clearTimeout(debounceTimer);
  }, [activePickerTab, giphyQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    try {
      await addDoc(collection(db, "testimonials"), {
        name: name.trim() ? name.trim() : "Anonim",
        content: content.trim(),
        cardColor: selectedColor,
        rating: rating,
        status: "pending",
        createdAt: serverTimestamp(),
        dateString: nowStr,
      });

      setName("");
      setContent("");
      setSelectedColor("rose");
      setRating(5);
      setActivePickerTab(null);
      setSuccessMessage(
        "Testimonial berhasil dikirim dan sedang menunggu tinjauan admin! Terima kasih 💕",
      );
    } catch (err) {
      console.error("Gagal menyimpan testimonial:", err);
      alert("Terjadi kesalahan saat mengirim. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmoji = (emoji: string) => setContent((prev) => prev + emoji);
  const addMediaUrl = (url: string) => {
    setContent((prev) => prev + `\n![media](${url})\n`);
    setActivePickerTab(null);
  };

  return (
    <div
      className={`${signika.className} min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 selection:bg-rose-300 selection:text-white pb-24`}
    >
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-8 bg-white p-4 px-6 rounded-full shadow-sm border border-slate-100">
        <Link
          href="/testimonial"
          className="inline-flex items-center gap-2 text-rose-500 font-bold text-sm hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Testimonial
        </Link>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <span className="bg-rose-100 text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-2 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Formulir Ulasan
          </span>
          <h1
            className={`${playfair.className} text-3xl md:text-4xl font-bold text-rose-950 mb-2`}
          >
            Bagikan Ceritamu
          </h1>
          <p className="text-slate-500 text-sm">
            Tuliskan kesan atau pengalaman belajarmu bersama Miss Ken.
          </p>
        </div>

        {/* COMPONENT FORM */}
        <TestimonialForm
          name={name}
          setName={setName}
          content={content}
          setContent={setContent}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          rating={rating}
          setRating={setRating}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
          activePickerTab={activePickerTab}
          setActivePickerTab={setActivePickerTab}
          customGifUrl={customGifUrl}
          setCustomGifUrl={setCustomGifUrl}
          giphyQuery={giphyQuery}
          setGiphyQuery={setGiphyQuery}
          giphyResults={giphyResults}
          isGiphyLoading={isGiphyLoading}
          addEmoji={addEmoji}
          addMediaUrl={addMediaUrl}
          COLOR_OPTIONS={COLOR_OPTIONS}
          EMOJI_LIST={EMOJI_LIST}
        />
      </div>
    </div>
  );
}
