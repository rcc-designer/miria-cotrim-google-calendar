import { NextResponse } from "next/server";
import { notifyAdminSafely } from "@/lib/emailNotifications";
import {
  cleanString,
  getSupabaseAdmin,
  isValidEmail,
  isValidPhone,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bride_name = cleanString(body.bride_name);
    const email = cleanString(body.email);
    const phone = cleanString(body.phone);
    const event_date = cleanString(body.event_date);
    const event_location = cleanString(body.event_location);
    const service_type = cleanString(body.service_type);
    const details = cleanString(body.details);

    if (
      !bride_name ||
      !email ||
      !phone ||
      !event_date ||
      !event_location ||
      !service_type ||
      !details
    ) {
      return NextResponse.json(
        { error: "Please complete all required bridal inquiry fields." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone or WhatsApp number." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("bridal_inquiries").insert({
      bride_name,
      email,
      phone,
      event_date,
      event_location,
      service_type,
      details,
    });

    if (error) {
      console.error("bridal_inquiries insert failed", error);
      return NextResponse.json(
        { error: "We could not save your bridal inquiry right now." },
        { status: 500 },
      );
    }

    await notifyAdminSafely({
      subject: "New bridal inquiry from the website",
      title: "New bridal inquiry",
      intro:
        "A bride submitted the Bridal inquiry form and the request was saved in Supabase.",
      fields: [
        { label: "Bride name", value: bride_name },
        { label: "Email", value: email },
        { label: "Phone / WhatsApp", value: phone },
        { label: "Event date", value: event_date },
        { label: "Event location", value: event_location },
        { label: "Service type", value: service_type },
        { label: "Details", value: details },
      ],
    });

    return NextResponse.json({
      ok: true,
      title: "Bridal inquiry received.",
      message:
        "Thank you. Your event details were saved and Miriã's team will review them before following up.",
    });
  } catch (error) {
    console.error("bridal route failed", error);
    return NextResponse.json(
      { error: "Supabase is not configured yet or the request could not be sent." },
      { status: 503 },
    );
  }
}
