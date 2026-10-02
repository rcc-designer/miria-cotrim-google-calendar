import { NextResponse } from "next/server";
import {
  BOOKING_TIME_ZONE,
  type BusyTime,
  addDays,
  buildAvailability,
  todayString,
  toDateString,
  zonedDateTimeToUtc,
} from "@/lib/availability";
import { getCalendarBusyTimes } from "@/lib/googleCalendar";
import { tryGetSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get("service") || "";
    const startDate = searchParams.get("start") || todayString();
    const endDate =
      searchParams.get("end") ||
      toDateString(addDays(new Date(`${startDate}T00:00:00.000Z`), 14));

    if (!serviceSlug) {
      return NextResponse.json(
        { error: "Please choose a service first." },
        { status: 400 },
      );
    }

    const timeMin = zonedDateTimeToUtc(
      startDate,
      "00:00",
      BOOKING_TIME_ZONE,
    ).toISOString();
    const timeMax = zonedDateTimeToUtc(
      toDateString(addDays(new Date(`${endDate}T00:00:00.000Z`), 1)),
      "00:00",
      BOOKING_TIME_ZONE,
    ).toISOString();

    let googleWarning = "";
    let busyTimes: BusyTime[] = [];

    try {
      const google = await getCalendarBusyTimes({
        timeMin,
        timeMax,
        timeZone: BOOKING_TIME_ZONE,
      });
      busyTimes = google.busy;

      if (!google.configured) {
        googleWarning =
          "Google Calendar is not configured yet; showing standard availability only.";
      }
    } catch (error) {
      console.error("Google Calendar availability failed", error);
      googleWarning =
        "Google Calendar availability could not be checked; showing standard availability only.";
    }

    const availability = await buildAvailability({
      supabase: tryGetSupabaseAdmin(),
      serviceSlug,
      startDate,
      endDate,
      busyTimes,
      timeZone: BOOKING_TIME_ZONE,
    });

    return NextResponse.json({
      ...availability,
      timeZone: BOOKING_TIME_ZONE,
      warning: googleWarning,
    });
  } catch (error) {
    console.error("availability route failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We could not load availability right now.",
      },
      { status: 500 },
    );
  }
}
