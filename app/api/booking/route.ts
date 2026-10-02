import { NextResponse } from "next/server";
import {
  BOOKING_TIME_ZONE,
  buildAvailability,
  toDateString,
  zonedDateTimeToUtc,
} from "@/lib/availability";
import {
  createPendingCalendarEvent,
  getCalendarBusyTimes,
} from "@/lib/googleCalendar";
import { cleanString, getSupabaseAdmin, isValidEmail } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = cleanString(body.name);
    const email = cleanString(body.email).toLowerCase();
    const phone = cleanString(body.phone);
    const serviceSlug = cleanString(body.service_slug);
    const requestedStart = cleanString(body.requested_start);
    const requestedEnd = cleanString(body.requested_end);
    const notes = cleanString(body.notes);
    const timeZone = cleanString(body.time_zone) || BOOKING_TIME_ZONE;

    if (!name || !email || !phone || !serviceSlug || !requestedStart || !requestedEnd) {
      return NextResponse.json(
        { error: "Please complete all required booking request fields." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const startDate = toDateString(new Date(requestedStart));
    const timeMin = zonedDateTimeToUtc(startDate, "00:00", timeZone).toISOString();
    const timeMax = zonedDateTimeToUtc(startDate, "23:59", timeZone).toISOString();
    const { busy } = await getCalendarBusyTimes({
      timeMin,
      timeMax,
      timeZone,
    });
    const availability = await buildAvailability({
      supabase,
      serviceSlug,
      startDate,
      endDate: startDate,
      busyTimes: busy,
      timeZone,
    });
    const selectedSlot = availability.slots.find(
      (slot) => slot.start_iso === requestedStart && slot.end_iso === requestedEnd,
    );

    if (!selectedSlot) {
      return NextResponse.json(
        {
          error:
            "That appointment time is no longer available. Please choose another time.",
        },
        { status: 409 },
      );
    }

    const googleEvent = await createPendingCalendarEvent({
      serviceName: availability.service.name,
      name,
      email,
      phone,
      notes,
      startIso: requestedStart,
      endIso: requestedEnd,
      timeZone,
    });

    const { error } = await supabase.from("booking_requests").insert({
      name,
      email,
      phone,
      service_id: availability.service.id || null,
      service_slug: availability.service.slug,
      requested_service: availability.service.name,
      preferred_date: selectedSlot.date,
      preferred_time: selectedSlot.start_label,
      requested_start: requestedStart,
      requested_end: requestedEnd,
      time_zone: timeZone,
      google_event_id: googleEvent.id,
      google_event_link: googleEvent.htmlLink,
      notes,
      status: "pending_confirmation",
      source: "book_page",
    });

    if (error) {
      console.error("booking_requests insert failed", error);
      return NextResponse.json(
        { error: "We could not save your booking request right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      title: "Appointment request received.",
      message:
        "Your selected time was saved as pending confirmation. Miriã's team will review it and follow up soon.",
      status: "pending_confirmation",
      googleEventId: googleEvent.id,
    });
  } catch (error) {
    console.error("booking route failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Supabase or Google Calendar is not configured yet.",
      },
      { status: 503 },
    );
  }
}
