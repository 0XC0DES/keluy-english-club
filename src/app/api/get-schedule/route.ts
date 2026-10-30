import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    return NextResponse.json(
      {
        success: false,
        message: "API Key atau Calendar ID belum dikonfigurasi di .env.local",
        data: [],
      },
      { status: 400 },
    );
  }

  try {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId,
    )}/events?key=${apiKey}&timeMin=${timeMin}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { success: false, message: data.error.message, data: [] },
        { status: 400 },
      );
    }

    const events = (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || "Sesi Konsultasi",
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
    }));

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data jadwal", data: [] },
      { status: 500 },
    );
  }
}
