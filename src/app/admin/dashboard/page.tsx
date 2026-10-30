"use client";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  Sparkles,
  Menu,
  Star,
  Send,
  ArrowUpRight,
  Pin,
  CalendarDays,
  CalendarX,
  CalendarCheck,
  Calendar as CalendarIcon,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Shield,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Check,
} from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
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

interface TestimonialItem {
  id: string;
  name: string;
  content: string;
  cardColor: string;
  rating: number;
  createdAt?: string;
  teacherReply?: string;
  replyDate?: string;
  status?: "pending" | "approved";
}

interface ServiceItem {
  id: string;
  category: "online" | "offline";
  name: string;
  target: string;
  duration: string;
  price: string;
  desc: string;
  isFeatured?: boolean;
  badgeText?: string;
}

interface DateOverrideItem {
  id: string;
  date: string;
  isHoliday: boolean;
  note?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

interface TermItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

interface FaqItem {
  id: string;
  q: string;
  a: string;
  icon?: string;
}

const COLOR_OPTIONS: Record<string, { bg: string; border: string }> = {
  rose: { bg: "bg-rose-50", border: "border-rose-200" },
  peach: { bg: "bg-orange-50", border: "border-orange-200" },
  mint: { bg: "bg-emerald-50", border: "border-emerald-200" },
  lavender: { bg: "bg-purple-50", border: "border-purple-200" },
  sky: { bg: "bg-sky-50", border: "border-sky-200" },
  amber: { bg: "bg-amber-50", border: "border-amber-200" },
};

const renderContentWithMedia = (text: string) => {
  if (!text) return null;
  const mediaRegex = /!\[media\]\((.*?)\)/g;
  const parts = text.split(mediaRegex);

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <img
          key={index}
          src={part}
          alt="Sticker/GIF"
          className="max-w-[120px] max-h-[120px] object-contain my-2 rounded-xl shadow-xs border border-slate-100 mx-auto"
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle,
  FileText,
  BookOpen,
  Clock,
  Shield,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar: CalendarIcon,
  Star,
  AlertCircle,
};

const AVAILABLE_ICONS = [
  { name: "HelpCircle", label: "Tanda Tanya (Help)" },
  { name: "FileText", label: "Dokumen (Text)" },
  { name: "BookOpen", label: "Buku (Book)" },
  { name: "Clock", label: "Waktu (Clock)" },
  { name: "Shield", label: "Perlindungan (Shield)" },
  { name: "CheckCircle2", label: "Centang (Check)" },
  { name: "Sparkles", label: "Kilau (Sparkles)" },
  { name: "MapPin", label: "Lokasi (Pin)" },
  { name: "Calendar", label: "Kalender" },
  { name: "Star", label: "Bintang" },
  { name: "AlertCircle", label: "Penting (Alert)" },
];

const renderDynamicIcon = (
  iconName?: string,
  className: string = "w-4 h-4",
) => {
  const IconComponent = ICON_MAP[iconName || "HelpCircle"] || HelpCircle;
  return <IconComponent className={className} />;
};

const formatRupiah = (value: string) => {
  const numberString = value.replace(/[^0-9]/g, "");
  if (!numberString) return "";
  const formatted = new Intl.NumberFormat("id-ID").format(Number(numberString));
  return `Rp ${formatted}`;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "overview" | "testimonials" | "services" | "schedule" | "terms" | "faqs"
  >("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [replyingTestiId, setReplyingTestiId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [dateOverridesMap, setDateOverridesMap] = useState<
    Record<string, DateOverrideItem>
  >({});
  const [dateOverridesList, setDateOverridesList] = useState<
    DateOverrideItem[]
  >([]);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");

  const [schedules, setSchedules] = useState<CalendarEvent[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [terms, setTerms] = useState<TermItem[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [termForm, setTermForm] = useState({
    title: "",
    content: "",
    icon: "FileText",
  });

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({ q: "", a: "", icon: "HelpCircle" });

  const [serviceForm, setServiceForm] = useState({
    category: "online" as "online" | "offline",
    name: "",
    target: "",
    price: "",
    desc: "",
    isFeatured: false,
    badgeText: "",
  });
  const [durationNum, setDurationNum] = useState("60");
  const [durationUnit, setDurationUnit] = useState("Menit");

  useEffect(() => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchTestimonials = async () => {
    setIsLoadingTestimonials(true);
    try {
      let q;
      try {
        q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
      } catch {
        q = collection(db, "testimonials");
      }
      const snapshot = await getDocs(q);
      const fetched: TestimonialItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedDate = "Baru saja";
        if (data.createdAt?.toDate) {
          formattedDate = data.createdAt.toDate().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
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
      console.error("Gagal mengambil testimonial:", err);
    } finally {
      setIsLoadingTestimonials(false);
    }
  };

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const snapshot = await getDocs(collection(db, "services"));
      const fetched: ServiceItem[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as ServiceItem);
      });
      setServices(fetched);
    } catch (err) {
      console.error("Gagal mengambil layanan:", err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const fetchDateOverrides = async () => {
    try {
      const snapshot = await getDocs(collection(db, "date_overrides"));
      const map: Record<string, DateOverrideItem> = {};
      const list: DateOverrideItem[] = [];
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as DateOverrideItem;
        map[docSnap.id] = item;
        list.push(item);
      });
      list.sort((a, b) => a.date.localeCompare(b.date));
      setDateOverridesMap(map);
      setDateOverridesList(list);
    } catch (err) {
      console.error("Gagal mengambil aturan jadwal:", err);
    }
  };

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const res = await fetch("/api/get-schedule");
      const result = await res.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (err) {
      console.error("Gagal mengambil kalender:", err);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchTerms = async () => {
    setIsLoadingTerms(true);
    try {
      const snapshot = await getDocs(collection(db, "terms"));
      const fetched: TermItem[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as TermItem);
      });
      setTerms(fetched);
    } catch (err) {
      console.error("Gagal mengambil S&K:", err);
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const fetchFaqs = async () => {
    setIsLoadingFaqs(true);
    try {
      const snapshot = await getDocs(collection(db, "faqs"));
      const fetched: FaqItem[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as FaqItem);
      });
      setFaqs(fetched);
    } catch (err) {
      console.error("Gagal mengambil FAQ:", err);
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTestimonials();
      fetchServices();
      fetchDateOverrides();
      fetchSchedules();
      fetchTerms();
      fetchFaqs();
    }
  }, [user]);

  const getMaxSessionsForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayNum = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayNum}`;

    const override = dateOverridesMap[dateStr];
    if (override !== undefined) {
      if (override.isHoliday) return 0;
      return 4;
    }

    const day = date.getDay();
    switch (day) {
      case 1:
        return 4;
      case 2:
        return 3;
      case 3:
        return 5;
      case 4:
        return 4;
      case 5:
        return 5;
      case 6:
        return 0;
      case 0:
        return 4;
      default:
        return 4;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const handleSetDateStatus = async (isHoliday: boolean) => {
    if (!selectedDate) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dayNum = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayNum}`;

    setIsSavingOverride(true);
    try {
      const docRef = doc(db, "date_overrides", dateStr);
      await setDoc(docRef, {
        date: dateStr,
        isHoliday,
        note:
          overrideNote.trim() ||
          (isHoliday ? "Libur Khusus" : "Buka Kelas Mengajar"),
        updatedAt: serverTimestamp(),
      });
      setOverrideNote("");
      fetchDateOverrides();
    } catch (err) {
      console.error("Gagal menyimpan tanggal:", err);
      alert("Gagal memperbarui status tanggal.");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleDeleteDateOverride = async (dateId: string) => {
    if (confirm(`Kembalikan tanggal ${dateId} ke aturan standar?`)) {
      try {
        await deleteDoc(doc(db, "date_overrides", dateId));
        fetchDateOverrides();
      } catch (err) {
        console.error("Gagal menghapus aturan jadwal:", err);
      }
    }
  };

  const handleApproveTestimonial = async (id: string) => {
    try {
      await updateDoc(doc(db, "testimonials", id), {
        status: "approved",
      });
      fetchTestimonials();
    } catch (err) {
      console.error("Gagal menyetujui testimonial:", err);
    }
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    const nowStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    try {
      const docRef = doc(db, "testimonials", id);
      await updateDoc(docRef, {
        teacherReply: replyText.trim(),
        replyDate: nowStr,
      });

      setReplyingTestiId(null);
      setReplyText("");
      fetchTestimonials();
    } catch (err) {
      console.error("Gagal membalas:", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (confirm("Hapus testimonial ini?")) {
      try {
        await deleteDoc(doc(db, "testimonials", id));
        fetchTestimonials();
      } catch (err) {
        console.error("Gagal menghapus testimonial:", err);
      }
    }
  };

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceForm({
      category: "online",
      name: "",
      target: "",
      price: "",
      desc: "",
      isFeatured: false,
      badgeText: "Best Value",
    });
    setDurationNum("60");
    setDurationUnit("Menit");
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setServiceForm({
      category: srv.category,
      name: srv.name,
      target: srv.target,
      price: srv.price,
      desc: srv.desc,
      isFeatured: srv.isFeatured || false,
      badgeText: srv.badgeText || "Best Value",
    });

    const parts = (srv.duration || "").trim().split(" ");
    if (parts.length >= 2) {
      setDurationNum(parts[0]);
      setDurationUnit(parts.slice(1).join(" "));
    } else {
      setDurationNum(parts[0] || "60");
      setDurationUnit("Menit");
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDuration = `${durationNum.trim()} ${durationUnit}`.trim();
    const payload = { ...serviceForm, duration: finalDuration };

    try {
      if (editingServiceId) {
        await updateDoc(doc(db, "services", editingServiceId), payload);
      } else {
        await addDoc(collection(db, "services"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      fetchServices();
    } catch (err) {
      console.error("Gagal menyimpan program:", err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Hapus program ini?")) {
      try {
        await deleteDoc(doc(db, "services", id));
        fetchServices();
      } catch (err) {
        console.error("Gagal menghapus program:", err);
      }
    }
  };

  const handleOpenAddTerm = () => {
    setEditingTermId(null);
    setTermForm({ title: "", content: "", icon: "FileText" });
    setIsTermModalOpen(true);
  };

  const handleOpenEditTerm = (term: TermItem) => {
    setEditingTermId(term.id);
    setTermForm({
      title: term.title,
      content: term.content,
      icon: term.icon || "FileText",
    });
    setIsTermModalOpen(true);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTermId) {
        await updateDoc(doc(db, "terms", editingTermId), termForm);
      } else {
        await addDoc(collection(db, "terms"), {
          ...termForm,
          createdAt: serverTimestamp(),
        });
      }
      setIsTermModalOpen(false);
      setEditingTermId(null);
      fetchTerms();
    } catch (err) {
      console.error("Gagal menyimpan S&K:", err);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (confirm("Hapus poin S&K ini?")) {
      try {
        await deleteDoc(doc(db, "terms", id));
        fetchTerms();
      } catch (err) {
        console.error("Gagal menghapus S&K:", err);
      }
    }
  };

  const handleOpenAddFaq = () => {
    setEditingFaqId(null);
    setFaqForm({ q: "", a: "", icon: "HelpCircle" });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (faq: FaqItem) => {
    setEditingFaqId(faq.id);
    setFaqForm({ q: faq.q, a: faq.a, icon: faq.icon || "HelpCircle" });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaqId) {
        await updateDoc(doc(db, "faqs", editingFaqId), faqForm);
      } else {
        await addDoc(collection(db, "faqs"), {
          ...faqForm,
          createdAt: serverTimestamp(),
        });
      }
      setIsFaqModalOpen(false);
      setEditingFaqId(null);
      fetchFaqs();
    } catch (err) {
      console.error("Gagal menyimpan FAQ:", err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm("Hapus FAQ ini?")) {
      try {
        await deleteDoc(doc(db, "faqs", id));
        fetchFaqs();
      } catch (err) {
        console.error("Gagal menghapus FAQ:", err);
      }
    }
  };

  const currentYear = currentMonthDate ? currentMonthDate.getFullYear() : 2026;
  const currentMonth = currentMonthDate ? currentMonthDate.getMonth() : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (!currentMonthDate) return;
    setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    if (!currentMonthDate) return;
    setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectedDateEvents = schedules.filter((event) => {
    if (!selectedDate) return false;
    const eventStart = new Date(event.start);
    return (
      eventStart.getFullYear() === selectedDate.getFullYear() &&
      eventStart.getMonth() === selectedDate.getMonth() &&
      eventStart.getDate() === selectedDate.getDate()
    );
  });

  const getEventsForDay = (day: number) => {
    return schedules.filter((event) => {
      const eventStart = new Date(event.start);
      return (
        eventStart.getFullYear() === currentYear &&
        eventStart.getMonth() === currentMonth &&
        eventStart.getDate() === day
      );
    });
  };

  const selectedDayMaxSessions = selectedDate
    ? getMaxSessionsForDate(selectedDate)
    : 4;
  const isSelectedDateHoliday = selectedDayMaxSessions === 0;

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";
  const selectedDateOverride = dateOverridesMap[selectedDateStr];

  const pendingTestimonialsCount = testimonials.filter(
    (t) => t.status === "pending" || !t.status,
  ).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-rose-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span
          className={`${signika.className} text-xs font-medium text-slate-500`}
        >
          Memuat Panel Admin...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${signika.className} min-h-screen bg-white text-slate-800 flex flex-col md:flex-row antialiased selection:bg-rose-200 selection:text-rose-900`}
    >
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between p-6 shrink-0 sticky top-0 h-screen shadow-2xs overflow-y-auto">
        <div>
          <div className="mb-8 px-2">
            <h1
              className={`${playfair.className} font-bold text-3xl text-rose-500 italic mb-0.5`}
            >
              Keluy.
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Admin Workspace
            </span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition ${
                activeTab === "overview"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
                activeTab === "schedule"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" /> Kelola Jadwal
              </div>
              {dateOverridesList.length > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "schedule"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {dateOverridesList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("testimonials")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
                activeTab === "testimonials"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" /> Testimonial
              </div>
              <div className="flex items-center gap-1.5">
                {pendingTestimonialsCount > 0 && (
                  <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {pendingTestimonialsCount} pending
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "testimonials"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {testimonials.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("services")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
                activeTab === "services"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" /> Kelola Program
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "services"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {services.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("terms")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
                activeTab === "terms"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" /> Kelola S&K
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "terms"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {terms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("faqs")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
                activeTab === "faqs"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4" /> Kelola FAQ
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "faqs"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {faqs.length}
              </span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-3 transition"
            >
              <ArrowUpRight className="w-4 h-4" /> Lihat Website Utama
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="px-2 mb-3">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.email}
            </p>
            <p className="text-[10px] text-slate-400">Pengajar / Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1
            className={`${playfair.className} font-bold text-2xl text-rose-500 italic`}
          >
            Keluy.
          </h1>
          <p className="text-[10px] text-slate-400 font-bold">
            ADMIN DASHBOARD
          </p>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-slate-600 hover:text-rose-500"
        >
          {isMobileSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* MENU DRAWER MOBILE */}
      {isMobileSidebarOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-2 z-30 shadow-md">
          <button
            onClick={() => {
              setActiveTab("overview");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-rose-500 text-white"
                : "text-slate-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("schedule");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === "schedule"
                ? "bg-rose-500 text-white"
                : "text-slate-600"
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Kelola Jadwal (
            {dateOverridesList.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("testimonials");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center justify-between ${
              activeTab === "testimonials"
                ? "bg-rose-500 text-white"
                : "text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Testimonial
            </div>
            {pendingTestimonialsCount > 0 && (
              <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                {pendingTestimonialsCount} pending
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("services");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === "services"
                ? "bg-rose-500 text-white"
                : "text-slate-600"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Kelola Program ({services.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("terms");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === "terms"
                ? "bg-rose-500 text-white"
                : "text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" /> Kelola S&K ({terms.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("faqs");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
              activeTab === "faqs" ? "bg-rose-500 text-white" : "text-slate-600"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Kelola FAQ ({faqs.length})
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full bg-gradient-to-b from-white via-white to-rose-50/20 min-h-screen">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Ringkasan Aktivitas
              </p>
              <h2
                className={`${playfair.className} text-2xl font-bold text-slate-900`}
              >
                Selamat Datang, Miss Ken
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-rose-100/80 rounded-2xl p-5 shadow-2xs">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Total Testimonial
                  </span>
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                </div>
                <h3
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  {testimonials.length}
                </h3>
              </div>

              <div className="bg-white border border-rose-100/80 rounded-2xl p-5 shadow-2xs">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Pending Review
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <h3
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  {pendingTestimonialsCount}
                </h3>
              </div>

              <div className="bg-white border border-rose-100/80 rounded-2xl p-5 shadow-2xs">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Program Aktif
                  </span>
                  <BookOpen className="w-4 h-4 text-rose-400" />
                </div>
                <h3
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  {services.length}
                </h3>
              </div>
            </div>

            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 shadow-2xs">
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`${playfair.className} text-lg font-bold text-slate-900`}
                >
                  Testimonial Terbaru
                </h3>
                <button
                  onClick={() => setActiveTab("testimonials")}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Kelola Semua
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {testimonials.slice(0, 3).map((item) => {
                  const isPending = item.status === "pending" || !item.status;
                  const colorStyle =
                    COLOR_OPTIONS[item.cardColor || "rose"] ||
                    COLOR_OPTIONS["rose"];

                  return (
                    <div
                      key={item.id}
                      className={`${colorStyle.bg} border-2 ${colorStyle.border} rounded-3xl p-4 shadow-sm flex flex-col justify-between overflow-hidden w-full`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                          <div className="overflow-hidden">
                            <h4
                              className={`${playfair.className} font-bold text-sm text-rose-950 truncate`}
                              title={item.name}
                            >
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {item.createdAt}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isPending
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isPending ? "Pending" : "Approved"}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 mb-2 text-amber-400">
                          {Array.from({ length: item.rating || 5 }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                              />
                            ),
                          )}
                        </div>

                        <div className="text-slate-700 text-xs leading-relaxed mb-3 whitespace-pre-line break-words overflow-hidden">
                          {renderContentWithMedia(item.content)}
                        </div>
                      </div>

                      {item.teacherReply && (
                        <div className="bg-white/70 p-2.5 rounded-xl border border-rose-100 overflow-hidden mt-2">
                          <span className="text-[10px] font-bold text-rose-600 block mb-0.5">
                            Balasan Anda:
                          </span>
                          <p className="text-[10px] text-slate-600 italic break-words">
                            "{item.teacherReply}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KELOLA JADWAL */}
        {activeTab === "schedule" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Kalender & Ketersediaan
              </p>
              <h2
                className={`${playfair.className} text-2xl font-bold text-slate-900`}
              >
                Kelola Jadwal & Libur
              </h2>
            </div>

            {!currentMonthDate || !selectedDate ? (
              <div className="flex justify-center py-12 text-rose-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-rose-100/80 shadow-2xs">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7 bg-rose-50/30 border border-rose-100 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-4 px-1">
                        <h3
                          className={`${playfair.className} text-base font-bold text-rose-950`}
                        >
                          {currentMonthDate.toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <div className="flex gap-1.5">
                          <button
                            onClick={prevMonth}
                            className="p-1.5 bg-white border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextMonth}
                            className="p-1.5 bg-white border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-rose-400 uppercase mb-2">
                        <div>Min</div>
                        <div>Sen</div>
                        <div>Sel</div>
                        <div>Rab</div>
                        <div>Kam</div>
                        <div>Jum</div>
                        <div>Sab</div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-9"></div>
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNumber = i + 1;
                          const dateObj = new Date(
                            currentYear,
                            currentMonth,
                            dayNumber,
                          );
                          const maxLimit = getMaxSessionsForDate(dateObj);
                          const isHoliday = maxLimit === 0;

                          const isSelected =
                            selectedDate.getFullYear() === currentYear &&
                            selectedDate.getMonth() === currentMonth &&
                            selectedDate.getDate() === dayNumber;

                          const now = new Date();
                          const isToday =
                            now.getFullYear() === currentYear &&
                            now.getMonth() === currentMonth &&
                            now.getDate() === dayNumber;

                          const dayEvents = getEventsForDay(dayNumber);
                          const hasEvents = dayEvents.length > 0;

                          return (
                            <button
                              key={`day-${dayNumber}`}
                              onClick={() => setSelectedDate(dateObj)}
                              className={`h-9 rounded-lg font-medium text-xs transition-all relative flex flex-col items-center justify-center ${
                                isSelected
                                  ? "bg-rose-500 text-white font-semibold shadow-xs"
                                  : isHoliday
                                    ? "bg-slate-200 text-slate-500 border border-slate-300"
                                    : isToday
                                      ? "border border-rose-500 text-rose-600 bg-white"
                                      : "hover:bg-rose-100/60 text-slate-700 bg-white border border-rose-50"
                              }`}
                            >
                              <span>{dayNumber}</span>
                              {isHoliday ? (
                                <span
                                  className={`text-[7px] font-bold uppercase leading-none mt-0.5 ${isSelected ? "text-white" : "text-slate-500"}`}
                                >
                                  Libur
                                </span>
                              ) : hasEvents ? (
                                <span
                                  className={`w-1 h-1 rounded-full absolute bottom-1 ${
                                    isSelected ? "bg-white" : "bg-rose-500"
                                  }`}
                                ></span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 border-t border-rose-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                          <span>Ada Sesi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                          <span>Libur</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 border border-rose-500 rounded-full"></span>
                          <span>Hari Ini</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-white border border-rose-100/80 rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="border-b border-rose-50 pb-3 mb-4 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Tanggal Terpilih
                            </span>
                            <h4
                              className={`${playfair.className} text-base font-bold text-rose-950`}
                            >
                              {selectedDate.toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </h4>
                          </div>
                          <CalendarIcon className="w-5 h-5 text-rose-400" />
                        </div>

                        {isSelectedDateHoliday ? (
                          <div className="mb-3 bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
                            <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-semibold">
                                Status: Libur / Tutup
                              </strong>
                              {selectedDateOverride?.note && (
                                <span className="text-[11px]">
                                  {selectedDateOverride.note}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Status: <strong>Buka Kelas</strong> (Maks.{" "}
                              {selectedDayMaxSessions} Sesi)
                            </span>
                          </div>
                        )}

                        {isLoadingSchedules ? (
                          <div className="flex justify-center py-4 text-rose-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : selectedDateEvents.length > 0 ? (
                          <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Sesi Terdaftar ({selectedDateEvents.length})
                            </p>
                            {selectedDateEvents.map((evt) => (
                              <div
                                key={evt.id}
                                className="bg-rose-50/40 border border-rose-100 p-2 rounded-lg text-xs font-semibold text-slate-800"
                              >
                                {evt.summary}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada sesi kelas terdaftar di Google Calendar.
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-rose-50 space-y-2.5">
                        <input
                          type="text"
                          placeholder="Catatan (opsional, misal: Libur Nasional)"
                          value={overrideNote}
                          onChange={(e) => setOverrideNote(e.target.value)}
                          className="w-full bg-rose-50/30 border border-rose-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isSavingOverride}
                            onClick={() => handleSetDateStatus(true)}
                            className="bg-red-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-700 transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <CalendarX className="w-3.5 h-3.5" /> Set Libur
                          </button>
                          <button
                            type="button"
                            disabled={isSavingOverride}
                            onClick={() => handleSetDateStatus(false)}
                            className="bg-emerald-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-emerald-700 transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" /> Set Buka
                          </button>
                        </div>

                        {selectedDateOverride && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteDateOverride(selectedDateStr)
                            }
                            className="w-full text-center text-[11px] text-slate-500 hover:text-red-600 pt-1 font-medium"
                          >
                            Hapus Pengecualian (Kembalikan ke Default)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-rose-100/80 rounded-3xl p-6 shadow-2xs">
                  <h3
                    className={`${playfair.className} text-base font-bold text-slate-900 mb-1`}
                  >
                    Daftar Semua Pengecualian Jadwal ({dateOverridesList.length}
                    )
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Daftar hari yang disetel libur khusus atau dibuka mengajar.
                  </p>

                  {dateOverridesList.length === 0 ? (
                    <div className="text-center py-6 bg-rose-50/30 rounded-xl border border-dashed border-rose-200 text-slate-400 text-xs">
                      Belum ada tanggal pengecualian disetel.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dateOverridesList.map((item) => {
                        const dateObj = new Date(item.date);
                        const formattedDateStr = dateObj.toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        );

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between gap-3 bg-rose-50/30"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-xs text-slate-900">
                                  {formattedDateStr}
                                </span>
                                {item.isHoliday ? (
                                  <span className="text-[9px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded">
                                    Libur
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                                    Buka
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <p className="text-[11px] text-slate-500 italic">
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteDateOverride(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-100/50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TESTIMONIAL (Uniform rounded-3xl cards & grid layout) */}
        {activeTab === "testimonials" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Interaksi Murid & Ulasan
              </p>
              <h2
                className={`${playfair.className} text-2xl font-bold text-slate-900`}
              >
                Kelola Testimonial ({testimonials.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ulasan baru berstatus{" "}
                <strong className="text-amber-600">Pending</strong>. Klik tombol{" "}
                <strong>Setujui</strong> agar ulasan tampil di website utama.
              </p>
            </div>

            {isLoadingTestimonials ? (
              <div className="flex justify-center py-12 text-rose-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-rose-100/80 text-xs">
                Belum ada testimonial masuk.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {testimonials.map((item) => {
                  const isPending = item.status === "pending" || !item.status;
                  const colorStyle =
                    COLOR_OPTIONS[item.cardColor || "rose"] ||
                    COLOR_OPTIONS["rose"];

                  return (
                    <div
                      key={item.id}
                      className={`${colorStyle.bg} border-2 ${
                        isPending ? "border-amber-300" : colorStyle.border
                      } rounded-3xl p-5 shadow-sm relative flex flex-col justify-between overflow-hidden w-full`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex justify-between items-start mb-3 pr-1">
                          <div className="overflow-hidden">
                            <h3
                              className={`${playfair.className} font-bold text-sm text-rose-950 truncate`}
                              title={item.name}
                            >
                              {item.name}
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              {item.createdAt}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                              isPending
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isPending ? "Pending" : "Approved"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: item.rating || 5 }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                                />
                              ),
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isPending && (
                              <button
                                onClick={() =>
                                  handleApproveTestimonial(item.id)
                                }
                                className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" /> Setujui
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTestimonial(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-50 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-slate-700 text-xs leading-relaxed mb-4 whitespace-pre-line break-words overflow-hidden">
                          {renderContentWithMedia(item.content)}
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-200/60">
                        {item.teacherReply ? (
                          <div className="bg-white/70 p-2.5 rounded-xl border border-rose-100 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-rose-500" />{" "}
                                Balasan Anda:
                              </span>
                              <button
                                onClick={() => {
                                  setReplyingTestiId(item.id);
                                  setReplyText(item.teacherReply || "");
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 underline font-medium"
                              >
                                Edit
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-600 italic break-words">
                              "{item.teacherReply}"
                            </p>
                          </div>
                        ) : (
                          replyingTestiId !== item.id && (
                            <button
                              onClick={() => {
                                setReplyingTestiId(item.id);
                                setReplyText("");
                              }}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Tulis Balasan
                            </button>
                          )
                        )}

                        {replyingTestiId === item.id && (
                          <div className="bg-white/90 p-3 rounded-2xl border border-rose-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-800 uppercase">
                              Tulis Balasan Pengajar:
                            </label>
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 break-words"
                            ></textarea>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setReplyingTestiId(null)}
                                className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-[10px] font-semibold hover:bg-slate-50"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={isSubmittingReply}
                                onClick={() => handleSaveReply(item.id)}
                                className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-semibold hover:bg-rose-600 flex items-center gap-1 shadow-2xs"
                              >
                                {isSubmittingReply ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-3 h-3" /> Kirim
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KELOLA PROGRAM (Uniform rounded-3xl cards & grid layout) */}
        {activeTab === "services" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  Katalog Paket
                </p>
                <h2
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  Kelola Program Belajar
                </h2>
              </div>
              <button
                onClick={handleOpenAddService}
                className="bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-rose-600 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" /> Tambah Program
              </button>
            </div>

            {isLoadingServices ? (
              <div className="flex justify-center py-12 text-rose-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-rose-100/80 text-xs">
                Belum ada program belajar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`bg-white border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden w-full ${
                      srv.isFeatured
                        ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/20"
                        : "border-rose-100"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md uppercase ${
                              srv.category === "online"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {srv.category}
                          </span>
                          {srv.isFeatured && (
                            <span className="text-[10px] font-semibold bg-rose-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Pin className="w-3 h-3 fill-white" />{" "}
                              {srv.badgeText || "Pinned"}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-rose-50 rounded-2xl flex flex-col items-center justify-center text-rose-400 p-3 text-center w-full h-24 mb-4 border border-rose-100">
                        <span className="font-bold text-2xl text-rose-600">
                          {srv.price}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">
                          {srv.duration}
                        </span>
                      </div>

                      <h3
                        className={`${playfair.className} font-bold text-lg text-rose-950 mb-1 truncate`}
                        title={srv.name}
                      >
                        {srv.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4 break-words">
                        Target:{" "}
                        <span className="text-slate-700">{srv.target}</span>
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-6 border-t border-rose-100 pt-3 break-words overflow-hidden">
                        {srv.desc}
                      </p>
                    </div>

                    <div className="text-[11px] font-medium text-slate-400 border-t border-rose-100 pt-3">
                      Target:{" "}
                      <span className="text-slate-700 font-semibold">
                        {srv.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KELOLA S&K (TERMS) */}
        {activeTab === "terms" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  Ketentuan Layanan
                </p>
                <h2
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  Kelola Syarat & Ketentuan (S&K)
                </h2>
              </div>
              <button
                onClick={handleOpenAddTerm}
                className="bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-rose-600 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" /> Tambah Poin S&K
              </button>
            </div>

            {isLoadingTerms ? (
              <div className="flex justify-center py-12 text-rose-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : terms.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-rose-100/80 text-xs">
                Belum ada data S&K.
              </div>
            ) : (
              <div className="space-y-4">
                {terms.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-rose-100/80 rounded-3xl p-6 shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                          {renderDynamicIcon(item.icon, "w-4 h-4")}
                        </div>
                        <h3
                          className={`${playfair.className} font-bold text-base text-slate-900`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditTerm(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTerm(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed pl-10 break-words">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: KELOLA FAQ */}
        {activeTab === "faqs" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  Pertanyaan Umum
                </p>
                <h2
                  className={`${playfair.className} text-2xl font-bold text-slate-900`}
                >
                  Kelola FAQ
                </h2>
              </div>
              <button
                onClick={handleOpenAddFaq}
                className="bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-rose-600 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" /> Tambah FAQ Baru
              </button>
            </div>

            {isLoadingFaqs ? (
              <div className="flex justify-center py-12 text-rose-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-rose-100/80 text-xs">
                Belum ada FAQ.
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-rose-100/80 rounded-3xl p-6 shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                          {renderDynamicIcon(item.icon, "w-4 h-4")}
                        </div>
                        <h3
                          className={`${playfair.className} font-bold text-sm text-slate-900`}
                        >
                          Q: {item.q}
                        </h3>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditFaq(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed pl-10 break-words">
                      A: {item.a}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL FORM PROGRAM */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-xl border border-rose-100">
            <button
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`${playfair.className} text-xl font-bold text-slate-900 mb-5`}
            >
              {editingServiceId
                ? "Edit Program Belajar"
                : "Tambah Program Baru"}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={serviceForm.category}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      category: e.target.value as "online" | "offline",
                    })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Program
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Basic English Kids"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 65000"
                    value={serviceForm.price}
                    onChange={(e) => {
                      const formatted = formatRupiah(e.target.value);
                      setServiceForm({ ...serviceForm, price: formatted });
                    }}
                    className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durasi
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="60"
                      value={durationNum}
                      onChange={(e) => setDurationNum(e.target.value)}
                      className="w-1/2 bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                    />
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                      className="w-1/2 bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                    >
                      <option value="Menit">Menit</option>
                      <option value="Sesi">Sesi</option>
                      <option value="Jam">Jam</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Murid
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Anak SD (7–12 Tahun)"
                  value={serviceForm.target}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, target: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Penjelasan singkat materi..."
                  value={serviceForm.desc}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, desc: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 break-words"
                ></textarea>
              </div>

              <div className="p-3.5 bg-rose-50/30 border border-rose-200 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceForm.isFeatured}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-rose-500 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-900">
                    Pin / Highlight Program Ini
                  </span>
                </label>

                {serviceForm.isFeatured && (
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Label Badge (Custom)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Best Price, Terfavorit, Best Value"
                      value={serviceForm.badgeText}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          badgeText: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 transition shadow-2xs mt-2 text-xs"
              >
                Simpan Program
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM S&K */}
      {isTermModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-xl border border-rose-100">
            <button
              onClick={() => setIsTermModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`${playfair.className} text-xl font-bold text-slate-900 mb-5`}
            >
              {editingTermId ? "Edit Poin S&K" : "Tambah Poin S&K Baru"}
            </h3>

            <form onSubmit={handleSaveTerm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Ikon
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 shrink-0">
                    {renderDynamicIcon(termForm.icon, "w-5 h-5")}
                  </div>
                  <select
                    value={termForm.icon}
                    onChange={(e) =>
                      setTermForm({ ...termForm, icon: e.target.value })
                    }
                    className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul S&K
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1. Ketentuan Sesi & Kehadiran"
                  value={termForm.title}
                  onChange={(e) =>
                    setTermForm({ ...termForm, title: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Isi / Detail Ketentuan
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan penjelasan detail..."
                  value={termForm.content}
                  onChange={(e) =>
                    setTermForm({ ...termForm, content: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 break-words"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 transition shadow-2xs mt-2 text-xs"
              >
                Simpan S&K
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-xl border border-rose-100">
            <button
              onClick={() => setIsFaqModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className={`${playfair.className} text-xl font-bold text-slate-900 mb-5`}
            >
              {editingFaqId ? "Edit Pertanyaan FAQ" : "Tambah FAQ Baru"}
            </h3>

            <form onSubmit={handleSaveFaq} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Ikon
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 shrink-0">
                    {renderDynamicIcon(faqForm.icon, "w-5 h-5")}
                  </div>
                  <select
                    value={faqForm.icon}
                    onChange={(e) =>
                      setFaqForm({ ...faqForm, icon: e.target.value })
                    }
                    className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pertanyaan (Q)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bagaimana cara mendaftar kelas?"
                  value={faqForm.q}
                  onChange={(e) =>
                    setFaqForm({ ...faqForm, q: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jawaban (A)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan jawaban yang jelas..."
                  value={faqForm.a}
                  onChange={(e) =>
                    setFaqForm({ ...faqForm, a: e.target.value })
                  }
                  className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 break-words"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 transition shadow-2xs mt-2 text-xs"
              >
                Simpan FAQ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
