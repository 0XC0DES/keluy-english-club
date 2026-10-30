"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Menu,
  X,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
  Phone,
  GraduationCap,
  Briefcase,
  Heart,
  Sparkles,
  BarChart3,
  MonitorPlay,
  MapPin,
  Info,
  AlertTriangle,
  Clock,
  Loader2,
  Ban,
  FileText,
  ChevronDown,
  UserCheck,
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Playfair_Display, Signika } from "next/font/google";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
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
  order?: number;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

interface TestimonialItem {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating?: number;
  status?: "pending" | "approved";
  order?: number;
  cardColor?: string;
  createdAt?: string;
  teacherReply?: string;
}

interface TermItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  order?: number;
}

interface FaqItem {
  id: string;
  q: string;
  a: string;
  icon?: string;
  order?: number;
}

interface DateOverrideItem {
  id: string;
  date: string;
  isHoliday: boolean;
  note?: string;
}

// Kamus pemetaan warna kartu testimonial
const COLOR_OPTIONS: Record<string, { bg: string; border: string }> = {
  rose: { bg: "bg-rose-50", border: "border-rose-200" },
  peach: { bg: "bg-orange-50", border: "border-orange-200" },
  mint: { bg: "bg-emerald-50", border: "border-emerald-200" },
  lavender: { bg: "bg-purple-50", border: "border-purple-200" },
  sky: { bg: "bg-sky-50", border: "border-sky-200" },
  amber: { bg: "bg-amber-50", border: "border-amber-200" },
};

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

const renderDynamicIcon = (
  iconName?: string,
  className: string = "w-5 h-5",
) => {
  const IconComponent = ICON_MAP[iconName || "HelpCircle"] || HelpCircle;
  return <IconComponent className={className} />;
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"online" | "offline">("online");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [bookingCardId, setBookingCardId] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState("");
  const [inputTime, setInputTime] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] =
    useState<boolean>(true);

  const [termsData, setTermsData] = useState<TermItem[]>([]);
  const [faqsData, setFaqsData] = useState<FaqItem[]>([]);
  const [dateOverridesMap, setDateOverridesMap] = useState<
    Record<string, DateOverrideItem>
  >({});

  const [schedules, setSchedules] = useState<CalendarEvent[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(true);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [openSection, setOpenSection] = useState<number | null>(0);
  const [openFaqSection, setOpenFaqSection] = useState<number | null>(0);

  const phoneNumber = "6281388020535";
  const navLinks = [
    "Profile",
    "Layanan",
    "Jadwal",
    "S&K",
    "FAQ",
    "Testimonial",
  ];

  const skills = [
    { name: "Academic English (TOEFL/IELTS)", percentage: 96 },
    { name: "Grammar & Structure", percentage: 93 },
    { name: "Speaking & Pronunciation", percentage: 88 },
    { name: "Kids & Fun Learning", percentage: 89 },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "date_overrides"),
      (snapshot) => {
        const map: Record<string, DateOverrideItem> = {};
        snapshot.forEach((docSnap) => {
          map[docSnap.id] = {
            id: docSnap.id,
            ...docSnap.data(),
          } as DateOverrideItem;
        });
        setDateOverridesMap(map);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingData(true);
      try {
        const q = query(
          collection(db, "services"),
          where("category", "==", activeTab),
        );
        const querySnapshot = await getDocs(q);
        const fetchedData: ServiceItem[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedData.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as ServiceItem);
        });

        fetchedData.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return (a.order || 0) - (b.order || 0);
        });

        setServices(fetchedData);
      } catch (error) {
        console.error("Gagal mengambil data layanan:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchServices();
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "testimonials"),
      (snapshot) => {
        const fetchedData: TestimonialItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status === "approved" || !data.status) {
            let formattedDate = "Baru saja";
            if (data.createdAt?.toDate) {
              formattedDate = data.createdAt
                .toDate()
                .toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
            } else if (data.dateString) {
              formattedDate = data.dateString;
            }

            fetchedData.push({
              id: docSnap.id,
              name: data.name || "Anonim",
              content: data.content || "",
              rating: data.rating || 5,
              cardColor: data.cardColor || "rose",
              createdAt: formattedDate,
              teacherReply: data.teacherReply || "",
              order: data.order || 0,
            } as TestimonialItem);
          }
        });
        fetchedData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setTestimonials(fetchedData);
        setIsLoadingTestimonials(false);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "terms"), (snapshot) => {
      const fetchedData: TermItem[] = [];
      snapshot.forEach((docSnap) => {
        fetchedData.push({ id: docSnap.id, ...docSnap.data() } as TermItem);
      });
      fetchedData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTermsData(fetchedData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "faqs"), (snapshot) => {
      const fetchedData: FaqItem[] = [];
      snapshot.forEach((docSnap) => {
        fetchedData.push({ id: docSnap.id, ...docSnap.data() } as FaqItem);
      });
      fetchedData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setFaqsData(fetchedData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        const res = await fetch("/api/get-schedule");
        const result = await res.json();
        if (result.success) {
          setSchedules(result.data);
        }
      } catch (err) {
        console.error("Terjadi kesalahan jaringan saat mengambil jadwal:", err);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleOpenBooking = (id: string | null) => {
    setBookingCardId(id);
    setInputDate("");
    setInputTime("");
    setErrorMessage("");
  };

  const handleProceedToWhatsApp = async (
    e: React.FormEvent,
    srv: ServiceItem,
  ) => {
    e.preventDefault();
    setErrorMessage("");
    setIsChecking(true);

    try {
      const reqStart = new Date(`${inputDate}T${inputTime}:00`);
      const now = new Date();
      if (reqStart < now) {
        setErrorMessage(
          "Tidak bisa memilih jadwal di masa lalu. Silakan pilih waktu yang akan datang.",
        );
        setIsChecking(false);
        return;
      }

      const maxSessions = getMaxSessionsForDate(reqStart);
      if (maxSessions === 0) {
        const year = reqStart.getFullYear();
        const month = String(reqStart.getMonth() + 1).padStart(2, "0");
        const dayNum = String(reqStart.getDate()).padStart(2, "0");
        const overrideNote =
          dateOverridesMap[`${year}-${month}-${dayNum}`]?.note;

        setErrorMessage(
          overrideNote
            ? `Hari ini libur: ${overrideNote}`
            : "Hari ini libur / tidak menerima kelas. Silakan pilih tanggal lain.",
        );
        setIsChecking(false);
        return;
      }

      if (reqStart.getDay() === 0) {
        const hour = parseInt(inputTime.split(":")[0], 10);
        if (hour < 12) {
          setErrorMessage(
            "Kelas untuk hari Minggu hanya tersedia mulai pukul 12.00 WIB siang.",
          );
          setIsChecking(false);
          return;
        }
      }

      const res = await fetch("/api/get-schedule");
      const result = await res.json();

      if (!result.success) {
        setErrorMessage("Gagal menyinkronkan kalender. Silakan coba lagi.");
        setIsChecking(false);
        return;
      }

      const scheduleList = result.data;
      const selectedDayEvents = scheduleList.filter(
        (event: { start: string }) => {
          const evDate = new Date(event.start);
          return (
            evDate.getFullYear() === reqStart.getFullYear() &&
            evDate.getMonth() === reqStart.getMonth() &&
            evDate.getDate() === reqStart.getDate()
          );
        },
      );

      if (selectedDayEvents.length >= maxSessions) {
        setErrorMessage(
          `Maaf, kuota jadwal untuk hari ini sudah penuh (${maxSessions} sesi). Silakan pilih tanggal lain.`,
        );
        setIsChecking(false);
        return;
      }

      let durationMins = 60;
      if (srv.duration.includes("90") || srv.duration.includes("1.5")) {
        durationMins = 90;
      }

      const reqEnd = new Date(reqStart.getTime() + durationMins * 60000);
      const hasConflict = scheduleList.some(
        (event: { start: string; end: string }) => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return reqStart < eventEnd && reqEnd > eventStart;
        },
      );

      if (hasConflict) {
        setErrorMessage(
          "Waduh, jam tersebut bentrok dengan jadwal kelas lain. Cek kalender di bawah untuk lihat jam kosong ya!",
        );
        setIsChecking(false);
        return;
      }

      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const formattedDate = reqStart.toLocaleDateString("id-ID", options);
      const modeKelas = activeTab === "online" ? "Online" : "Offline";

      const text = `Halo Miss Ken! 👋 Aku sudah cek website Keluy English Club.\nAku tertarik untuk daftar kelas ${modeKelas} ${srv.name} untuk jadwal hari ${formattedDate}, jam ${inputTime} WIB.\nApakah slotnya masih tersedia, Miss?`;

      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
      setBookingCardId(null);
    } catch {
      setErrorMessage(
        "Terjadi kesalahan sistem, silakan coba beberapa saat lagi.",
      );
    } finally {
      setIsChecking(false);
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
  const isSelectedDateFull =
    selectedDayMaxSessions > 0 &&
    selectedDateEvents.length >= selectedDayMaxSessions;
  const isSelectedDateHoliday = selectedDayMaxSessions === 0;
  const isSelectedSunday = selectedDate?.getDay() === 0;

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";
  const selectedDateNote = dateOverridesMap[selectedDateStr]?.note;

  return (
    <div
      className={`${signika.className} min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 selection:bg-rose-300 selection:text-white pb-20 scroll-smooth`}
    >
      {/* NAVBAR */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-6 bg-white p-4 md:px-8 rounded-full shadow-sm border border-slate-100 sticky top-4 z-50 relative">
        <div
          className={`${playfair.className} font-bold text-2xl text-rose-500 italic`}
        >
          Keluy.
        </div>

        <div className="hidden md:flex gap-8 text-slate-600 font-medium text-sm">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace("&", "")}`}
              className="hover:text-rose-500 transition"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isAuthChecking &&
            (currentUser ? (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 md:gap-2 bg-rose-500 text-white px-4 md:px-6 py-2 rounded-full font-medium hover:bg-rose-600 transition shadow-md text-xs md:text-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4" />{" "}
                Dashboard
              </Link>
            ) : (
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 md:gap-2 bg-white text-rose-600 border border-rose-300 px-4 md:px-6 py-2 rounded-full font-medium hover:bg-rose-500 hover:text-white hover:border-rose-500 transition shadow-2xs text-xs md:text-sm"
              >
                <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> Login
              </Link>
            ))}

          <button
            className="md:hidden text-rose-500 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl p-5 shadow-xl border border-rose-100 flex flex-col gap-3 text-center z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace("&", "")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-700 font-medium py-2 px-4 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition"
              >
                {link}
              </a>
            ))}
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto space-y-20">
        {/* HERO */}
        <header
          id="welcome"
          className="bg-rose-100 border border-rose-200 rounded-[2.5rem] p-8 md:p-12 relative shadow-sm overflow-hidden flex flex-col md:flex-row gap-8"
        >
          <div className="flex-1 relative z-10 flex flex-col justify-between">
            <div>
              <p className="text-rose-500 tracking-[0.4em] text-sm md:text-base font-bold mb-2">
                E N G L I S H C L U B
              </p>
              <h1
                className={`${playfair.className} italic text-rose-950 font-medium text-5xl md:text-6xl lg:text-7xl mb-6`}
              >
                By Miss Ken
              </h1>
              <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
                ( English for Kids, Teens & Adults, <br /> Online & Offline )
              </p>
            </div>

            <div className="bg-white rounded-[2rem] p-6 max-w-sm mt-12 relative shadow-lg text-slate-700 border border-rose-50">
              <p className="text-base font-medium leading-relaxed mb-4">
                Menyediakan kelas Bahasa Inggris yang fleksibel, interaktif, dan
                disesuaikan dengan kebutuhan setiap murid. Mulai dari pengenalan
                bahasa dasar, hingga persiapan tes akademis.
              </p>
              <button
                onClick={() =>
                  document
                    .getElementById("layanan")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="absolute -bottom-4 -right-4 md:bottom-4 md:-right-6 bg-white p-3 rounded-xl shadow-xl border-[6px] border-rose-100 hover:scale-110 transition"
              >
                <ArrowRight className="w-5 h-5 text-rose-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center items-center relative z-0 mt-8 md:mt-0">
            <img
              src="/Teacher.png"
              alt="Ilustrasi Keluy"
              className="w-full max-w-sm h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </header>

        {/* PROFILE */}
        <section id="profile" className="scroll-mt-32">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center mb-10">
            <span className="text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Profil Pengajar
            </span>
            <h2
              className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-bold mb-3`}
            >
              Mengenal Tutor: Miss Ken
            </h2>
            <p
              className={`${signika.className} text-slate-600 text-sm md:text-base leading-relaxed`}
            >
              Kenalan lebih dekat dengan latar belakang, pengalaman, dan
              keahlian pengajar utama Keluy English Club.
            </p>
          </div>

          <div className="bg-rose-100 border border-rose-200 rounded-[2.5rem] p-6 md:p-10 flex flex-col lg:flex-row gap-8 shadow-sm">
            <div className="lg:w-5/12 flex flex-col gap-6">
              <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-rose-50 relative overflow-hidden h-[300px] md:h-[350px]">
                <img
                  src="/miss.jpeg"
                  alt="Miss Ken"
                  className="w-full h-full object-cover rounded-[1.5rem]"
                />
                <div className="absolute bottom-3 left-3 right-3 rounded-[1.5rem] bg-gradient-to-t from-rose-950/90 to-transparent p-6 pt-20 flex flex-col justify-end">
                  <h3
                    className={`${playfair.className} text-white text-2xl font-bold`}
                  >
                    Miss Ken
                  </h3>
                  <p
                    className={`${signika.className} text-rose-200 text-sm font-medium`}
                  >
                    Pengajar Utama
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-rose-50">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4
                    className={`${playfair.className} text-xl font-bold text-rose-950`}
                  >
                    Skill & Keahlian
                  </h4>
                </div>

                <div className={`${signika.className} space-y-4`}>
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 px-1">
                        <span>{skill.name}</span>
                        <span className="text-rose-500">
                          {skill.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-rose-50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-rose-400 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${skill.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-200 text-center flex flex-col items-center justify-center gap-3 flex-1">
                <Heart className="w-6 h-6 text-rose-400" />
                <p
                  className={`${playfair.className} italic font-bold text-rose-900 text-lg`}
                >
                  "Belajar bareng aku dijamin santai dan fleksibel, tapi target
                  belajarmu bakal tetep tercapai. Let's learn English the easy
                  way!"
                </p>
              </div>
            </div>

            <div className="lg:w-7/12 flex flex-col gap-6">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-rose-50 relative">
                <Sparkles className="absolute top-6 right-6 w-6 h-6 text-rose-200 hidden md:block" />
                <p
                  className={`${signika.className} text-slate-600 leading-relaxed text-sm md:text-base md:pr-8`}
                >
                  <span className="font-bold text-rose-500 text-lg">
                    Halo! Aku Miss Ken,
                  </span>{" "}
                  pengajar utama di Keluy English Club. Sebagai lulusan S1
                  Sastra Inggris, aku punya passion besar buat bantu siapa aja!
                  Dari anak-anak sampai orang dewasa, biar bisa ngobrol pakai
                  bahasa Inggris dengan pede dan pastinya tanpa takut salah!
                </p>
              </div>

              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-rose-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4
                    className={`${playfair.className} text-xl font-bold text-rose-950`}
                  >
                    Pengalaman Mengajar
                  </h4>
                </div>
                <p
                  className={`${signika.className} text-slate-600 text-sm md:text-base leading-relaxed`}
                >
                  Perjalanan mengajarku lumayan seru dan beragam nih. Aku pernah
                  jadi Guru Bahasa Inggris di salah satu SMK di Kabupaten Bogor
                  (2024–2025), dan sekarang masih aktif ngajar ekskul Bahasa
                  Inggris di salah satu SD di kawasan Cibinong. Di luar itu, aku
                  juga rutin pegang kelas private online buat puluhan murid dari
                  berbagai jenjang usia.
                </p>
              </div>

              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-rose-50 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4
                    className={`${playfair.className} text-xl font-bold text-rose-950`}
                  >
                    Spesialisasi Akademik (TOEFL, IELTS, & TOEIC)
                  </h4>
                </div>
                <div
                  className={`${signika.className} space-y-4 text-slate-600 text-sm md:text-base leading-relaxed`}
                >
                  <p>
                    Khusus buat program Test Preparation, aku bener-bener
                    mengedepankan kualitas materi berbasis akademik. Jujur aja,
                    aku memang sengaja memilih nggak ambil tes sertifikasi
                    berbayar supaya rate les di sini bisa tetap terjangkau buat
                    semua orang. Tapi jangan khawatir, kemampuanku tetap berakar
                    pada penguasaan akademik murni.
                  </p>
                  <p>
                    Sewaktu kuliah Sastra Inggris dulu, mata kuliah wajib TOEFL,
                    IELTS, dan TOEIC berhasil aku selesaikan dengan{" "}
                    <strong className="text-rose-500">
                      predikat A (IPK 4.00)
                    </strong>
                    . Di setiap sesi Test Prep, aku selalu pakai modul resmi
                    standar internasional dan pakai metode bedah grammar,
                    writing, serta speaking yang terstruktur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LAYANAN */}
        <section id="layanan" className="scroll-mt-32 relative">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center mb-10">
            <span
              className={`${signika.className} bg-rose-100 text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-2 shadow-sm mb-4`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Pilihan Program
            </span>
            <h2
              className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-bold mb-3`}
            >
              Layanan yang Kami Siapkan
            </h2>
            <p
              className={`${signika.className} text-slate-600 text-sm md:text-base leading-relaxed`}
            >
              Pilih paket belajar online atau offline yang paling sesuai dengan
              kebutuhanmu. Bimbingan ramah, profesional, dan fleksibel.
            </p>
          </div>

          <div
            className={`${signika.className} flex flex-col items-center mb-8`}
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setActiveTab("online");
                  setBookingCardId(null);
                }}
                className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-md transition-colors flex items-center gap-2 ${
                  activeTab === "online"
                    ? "bg-rose-500 text-white"
                    : "bg-white text-slate-600 border border-rose-200 hover:bg-rose-50"
                }`}
              >
                <MonitorPlay className="w-4 h-4" /> ONLINE
              </button>
              <button
                onClick={() => {
                  setActiveTab("offline");
                  setBookingCardId(null);
                }}
                className={`px-8 py-2.5 rounded-full font-bold text-sm shadow-md transition-colors flex items-center gap-2 ${
                  activeTab === "offline"
                    ? "bg-rose-500 text-white"
                    : "bg-white text-slate-600 border border-rose-200 hover:bg-rose-50"
                }`}
              >
                <MapPin className="w-4 h-4" /> OFFLINE
              </button>
            </div>

            {activeTab === "online" && (
              <div className="mt-6 max-w-2xl bg-white border border-rose-200 text-slate-600 text-xs md:text-sm leading-relaxed px-6 py-4 rounded-2xl shadow-sm transition-all duration-300 flex items-start gap-3 text-left">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <p>
                  Sistem kelas online dirancang fleksibel (bisa pilih jadwal,
                  materi custom, dan bayar per sesi tanpa komitmen bulanan)
                  dengan durasi 60–90 menit melalui platform Google Meet / Zoom.
                </p>
              </div>
            )}

            {activeTab === "offline" && (
              <div className="mt-6 max-w-2xl space-y-4 text-left transition-all duration-300">
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm leading-relaxed px-6 py-4 rounded-2xl shadow-sm flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block font-bold text-amber-950 mb-1">
                      Pengumuman Penting:
                    </strong>
                    Pendaftaran murid baru untuk seluruh program OFFLINE saat
                    ini <strong>DITUTUP SEMENTARA</strong> dan baru akan dibuka
                    kembali pada Januari 2027.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-rose-100 border border-rose-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm transition-all duration-500 min-h-[250px] flex items-center justify-center">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center py-12 text-rose-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className={`${signika.className} text-sm font-medium`}>
                  Memuat data program...
                </span>
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-rose-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3
                  className={`${playfair.className} text-lg font-bold text-rose-950 mb-1`}
                >
                  Belum Ada Program
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`bg-white border rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                      srv.isFeatured
                        ? "border-rose-300 ring-2 ring-rose-100 bg-gradient-to-b from-white to-rose-50/30"
                        : "border-rose-100"
                    } ${bookingCardId === srv.id ? "ring-2 ring-rose-400" : ""}`}
                  >
                    <div>
                      {srv.isFeatured && (
                        <span
                          className={`${signika.className} inline-block bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm`}
                        >
                          {srv.badgeText || "Best Service"}
                        </span>
                      )}
                      <div className="bg-rose-50 rounded-xl flex flex-col items-center justify-center text-rose-400 p-3 text-center w-full h-24 mb-4">
                        <span
                          className={`${signika.className} font-bold text-2xl text-rose-600`}
                        >
                          {srv.price}
                        </span>
                        <span
                          className={`${signika.className} text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider`}
                        >
                          {srv.duration}
                        </span>
                      </div>
                      <h4
                        className={`${signika.className} text-rose-950 text-xl font-bold leading-tight mb-1`}
                      >
                        {srv.name}
                      </h4>
                      <p
                        className={`${signika.className} text-slate-500 text-xs leading-relaxed font-medium`}
                      >
                        Target:{" "}
                        <span className="text-slate-700">{srv.target}</span>
                      </p>
                      <p
                        className={`${signika.className} text-slate-500 text-xs mt-3 leading-relaxed border-t border-rose-100 pt-3 mb-6`}
                      >
                        {srv.desc}
                      </p>
                    </div>

                    {bookingCardId === srv.id ? (
                      <form
                        onSubmit={(e) => handleProceedToWhatsApp(e, srv)}
                        className={`${signika.className} bg-rose-50/50 p-4 rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200`}
                      >
                        <div className="mb-3 text-center border-b border-rose-100 pb-2">
                          <span className="text-rose-600 font-bold text-xs uppercase tracking-wider">
                            Atur Jadwalmu
                          </span>
                        </div>

                        {errorMessage && (
                          <div className="mb-3 bg-red-50 border border-red-100 text-red-600 text-[10px] p-2 rounded-xl flex items-start gap-1.5 leading-tight">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />{" "}
                            Tanggal
                          </label>
                          <input
                            type="date"
                            required
                            value={inputDate}
                            onChange={(e) => {
                              setInputDate(e.target.value);
                              setErrorMessage("");
                            }}
                            className="w-full bg-white border border-rose-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all cursor-pointer"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-400" /> Jam
                          </label>
                          <input
                            type="time"
                            required
                            value={inputTime}
                            onChange={(e) => {
                              setInputTime(e.target.value);
                              setErrorMessage("");
                            }}
                            className="w-full bg-white border border-rose-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all cursor-pointer"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isChecking}
                            onClick={() => handleOpenBooking(null)}
                            className="w-1/3 bg-white border border-slate-200 text-slate-500 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={isChecking}
                            className="w-2/3 bg-[#25D366] text-white font-bold text-xs py-2.5 rounded-xl shadow-sm hover:bg-[#1DA851] transition flex items-center justify-center gap-1.5 disabled:opacity-70"
                          >
                            {isChecking ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <MessageCircle className="w-4 h-4" /> Ke WA
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleOpenBooking(srv.id)}
                        className={`${signika.className} w-full bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-rose-400 hover:text-white transition`}
                      >
                        Pilih Paket Ini
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* JADWAL */}
        <section id="jadwal" className="scroll-mt-32">
          <div className="bg-white rounded-[3rem] p-6 md:p-12 shadow-xl shadow-rose-100/40 border border-rose-50">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-100 rounded-2xl mb-4 text-rose-500 shadow-sm">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h2
                className={`${playfair.className} text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2`}
              >
                Jadwal & Agenda
              </h2>
              <p className="text-sm md:text-base text-slate-500">
                Pilih tanggal di kalender untuk melihat ketersediaan sesi.
              </p>
            </div>

            {!currentMonthDate || !selectedDate ? (
              <div className="flex flex-col items-center justify-center py-20 text-rose-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Memuat kalender...</span>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-7/12 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h3
                      className={`${playfair.className} text-xl md:text-2xl font-bold text-rose-950`}
                    >
                      {currentMonthDate.toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={prevMonth}
                        className="p-2.5 bg-white border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-500 hover:text-white transition shadow-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-2.5 bg-white border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-500 hover:text-white transition shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
                    <div>Min</div>
                    <div>Sen</div>
                    <div>Sel</div>
                    <div>Rab</div>
                    <div>Kam</div>
                    <div>Jum</div>
                    <div>Sab</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-10 md:h-12"></div>
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
                      const isFull = !isHoliday && dayEvents.length >= maxLimit;
                      const hasEvents = dayEvents.length > 0;

                      return (
                        <button
                          key={`day-${dayNumber}`}
                          disabled={isHoliday}
                          onClick={() => !isHoliday && setSelectedDate(dateObj)}
                          className={`h-10 md:h-12 rounded-2xl font-medium text-sm transition-all relative flex flex-col items-center justify-center ${
                            isHoliday
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70"
                              : isSelected
                                ? "bg-rose-500 text-white font-bold shadow-md scale-105"
                                : isFull
                                  ? "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
                                  : isToday
                                    ? "border-2 border-rose-400 text-rose-600 bg-white"
                                    : "hover:bg-rose-100 text-slate-700 bg-white/60"
                          }`}
                        >
                          <span>{dayNumber}</span>
                          {isHoliday ? (
                            <span className="text-[8px] font-bold uppercase leading-none mt-0.5 text-slate-400">
                              Libur
                            </span>
                          ) : isFull ? (
                            <span
                              className={`text-[8px] font-bold uppercase leading-none mt-0.5 ${isSelected ? "text-white" : "text-red-500"}`}
                            >
                              Penuh
                            </span>
                          ) : hasEvents ? (
                            <span
                              className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                                isSelected ? "bg-white" : "bg-rose-500"
                              }`}
                            ></span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full lg:w-5/12 bg-white border border-rose-100 rounded-[2.5rem] p-6 shadow-md flex flex-col justify-between min-h-[420px]">
                  <div>
                    <div className="border-b border-rose-100 pb-4 mb-6 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block">
                          Detail Agenda
                        </span>
                        <h4
                          className={`${playfair.className} text-xl md:text-2xl font-bold text-rose-950`}
                        >
                          {selectedDate.toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </h4>
                      </div>
                      <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                    </div>

                    {isSelectedDateHoliday && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl flex items-start gap-2">
                        <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">
                            Hari Libur / Tutup Kelas
                          </strong>
                          {selectedDateNote && <span>{selectedDateNote}</span>}
                        </div>
                      </div>
                    )}

                    {isLoadingSchedules ? (
                      <div className="flex flex-col items-center justify-center py-10 text-rose-500 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-medium">
                          Memuat jadwal...
                        </span>
                      </div>
                    ) : selectedDateEvents.length > 0 ? (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Sesi Terdaftar ({selectedDateEvents.length}/
                            {selectedDayMaxSessions})
                          </p>
                        </div>
                        {selectedDateEvents.map((evt) => {
                          const start = new Date(evt.start);
                          const end = new Date(evt.end);
                          const timeRange = `${start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;

                          return (
                            <div
                              key={evt.id}
                              className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-rose-600 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-rose-100 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-500" />{" "}
                                  {timeRange}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-800 text-sm mt-1">
                                {evt.summary}
                              </h5>
                            </div>
                          );
                        })}
                      </div>
                    ) : isSelectedDateHoliday ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                        Tidak ada agenda kelas.
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-4">
                        <Clock className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                        <p className="text-slate-700 font-bold text-sm mb-1">
                          Slot Masih Kosong
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-rose-100">
                    {isSelectedDateHoliday ? (
                      <button
                        disabled
                        className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        <Ban className="w-4 h-4 text-slate-400" /> Kelas Tidak
                        Tersedia (Libur)
                      </button>
                    ) : isSelectedDateFull ? (
                      <button
                        disabled
                        className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        <Ban className="w-4 h-4 text-red-400" /> Kuota Sesi
                        Penuh
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsWaModalOpen(true)}
                        className="w-full bg-rose-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-rose-600 transition shadow-md flex items-center justify-center gap-2 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" /> Request Slot
                        Tanggal Ini
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SYARAT & KETENTUAN */}
        <section id="sk" className="scroll-mt-32 max-w-5xl mx-auto my-16">
          <div className="text-center mb-12">
            <p className="text-rose-500 tracking-[0.3em] text-xs font-bold uppercase mb-2">
              INFORMASI PENTING
            </p>
            <h2
              className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-bold`}
            >
              Syarat & Ketentuan Layanan
            </h2>
          </div>

          <div className="space-y-4">
            {termsData.map((item, idx) => {
              const isOpen = openSection === idx;
              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm ${
                    isOpen
                      ? "border-rose-300 shadow-md ring-2 ring-rose-100"
                      : "border-rose-100 hover:border-rose-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenSection(isOpen ? null : idx)}
                    className="w-full text-left p-6 md:p-8 flex justify-between items-center focus:outline-none bg-white hover:bg-rose-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 pr-4">
                      <div className="p-3 bg-rose-50 rounded-xl shrink-0 text-rose-500">
                        {renderDynamicIcon(item.icon, "w-6 h-6")}
                      </div>
                      <h3
                        className={`${playfair.className} text-lg md:text-xl font-bold text-rose-950`}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <div
                      className={`p-2 rounded-full shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? "bg-rose-500 text-white rotate-180"
                          : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                  <div
                    className={`px-6 md:px-8 overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen
                        ? "max-h-[1000px] pb-8 opacity-100 border-t border-rose-50 pt-6"
                        : "max-h-0 opacity-0 pb-0 pt-0"
                    }`}
                  >
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line pl-12">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-32 max-w-5xl mx-auto my-16">
          <div className="text-center mb-12">
            <p className="text-rose-500 tracking-[0.3em] text-xs font-bold uppercase mb-2">
              PERTANYAAN UMUM
            </p>
            <h2
              className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-bold`}
            >
              Frequently Asked Questions (FAQ)
            </h2>
          </div>

          <div className="space-y-4">
            {faqsData.map((item, idx) => {
              const isOpen = openFaqSection === idx;
              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm ${
                    isOpen
                      ? "border-rose-300 shadow-md ring-2 ring-rose-100"
                      : "border-rose-100 hover:border-rose-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqSection(isOpen ? null : idx)}
                    className="w-full text-left p-6 md:p-8 flex justify-between items-center focus:outline-none bg-white hover:bg-rose-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 pr-4">
                      <div className="p-3 bg-rose-50 rounded-xl shrink-0 text-rose-500">
                        {renderDynamicIcon(item.icon, "w-6 h-6")}
                      </div>
                      <h3
                        className={`${playfair.className} text-lg md:text-xl font-bold text-rose-950`}
                      >
                        {item.q}
                      </h3>
                    </div>
                    <div
                      className={`p-2 rounded-full shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? "bg-rose-500 text-white rotate-180"
                          : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                  <div
                    className={`px-6 md:px-8 overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen
                        ? "max-h-[1000px] pb-8 opacity-100 border-t border-rose-50 pt-6"
                        : "max-h-0 opacity-0 pb-0 pt-0"
                    }`}
                  >
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line pl-12">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TESTIMONIAL (Maksimal 3 Ditampilkan, Card Sama Persis, Aman Teks Panjang) */}
        <section
          id="testimonial"
          className="scroll-mt-32 max-w-6xl mx-auto my-16"
        >
          <div className="text-center mb-12">
            <p className="text-rose-500 tracking-[0.3em] text-xs font-bold uppercase mb-2">
              TESTIMONIAL
            </p>
            <h2
              className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-bold`}
            >
              Apa Kata Murid & Orang Tua
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-2 max-w-xl mx-auto">
              Pengalaman nyata dari murid dan orang tua murid yang telah belajar
              bersama Miss Ken di Keluy English Club.
            </p>
          </div>

          {isLoadingTestimonials ? (
            <div className="flex flex-col items-center justify-center py-12 text-rose-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">Memuat testimonial...</span>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 shadow-sm text-rose-400">
                <Star className="w-6 h-6" />
              </div>
              <h3
                className={`${playfair.className} text-lg font-bold text-rose-950 mb-1`}
              >
                Belum Ada Testimonial
              </h3>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.slice(0, 3).map((item) => {
                  const styleColor =
                    COLOR_OPTIONS[item.cardColor || "rose"] ||
                    COLOR_OPTIONS["rose"];

                  return (
                    <div
                      key={item.id}
                      className={`${styleColor.bg} border-2 ${styleColor.border} rounded-3xl p-4 shadow-sm relative flex flex-col justify-between transition hover:shadow-md w-full overflow-hidden`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 pr-2">
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

              {testimonials.length > 3 && (
                <div className="text-center mt-10">
                  <Link
                    href="/testimonial"
                    className="inline-flex items-center gap-2 bg-rose-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-rose-600 transition shadow-md text-sm group"
                  >
                    Lihat Semua Testimonial ({testimonials.length}){" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* INFO KONTAK */}
        <section
          id="info"
          className="bg-rose-100 border border-rose-200 rounded-[2.5rem] p-12 text-center relative shadow-sm scroll-mt-32"
        >
          <h2
            className={`${playfair.className} text-3xl md:text-4xl text-rose-950 font-medium mb-4`}
          >
            Mulai Perjalananmu Sekarang
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Jangan ragu untuk menghubungi kami jika ada pertanyaan seputar
            pendaftaran, layanan, atau ketersediaan jadwal.
          </p>
          <button
            onClick={() => setIsWaModalOpen(true)}
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            <Phone className="w-5 h-5" /> Chat via WhatsApp
          </button>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Keluy English Club. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Star className="w-4 h-4 text-rose-400" /> for Keluy
        </p>
      </footer>

      {/* WHATSAPP MODAL */}
      {isWaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full relative shadow-2xl">
            <button
              onClick={() => setIsWaModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-rose-500 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3
              className={`${playfair.className} text-2xl font-medium mb-2 text-rose-950`}
            >
              Hubungi Admin
            </h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Admin kami akan membalas pesan Anda secepatnya untuk konsultasi
              jadwal dan pendaftaran kelas.
            </p>
            <a
              href="https://wa.me/6281388020535?text=Halo%20Miss%20Ken,%20saya%20ingin%20bertanya%20seputar%20Keluy%20English%20Club."
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center gap-2 w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 shadow-md transition"
            >
              Lanjutkan ke WhatsApp <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
