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
    const name = cleanString(body.name);
    const email = cleanString(body.email);
    const phone = cleanString(body.phone);
    const message = cleanString(body.message);
    const source = cleanString(body.source) || "contact_page";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please complete name, email and message." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone or WhatsApp number." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      phone,
      message,
      source,
    });

    if (error) {
      console.error("contact_messages insert failed", error);
      return NextResponse.json(
        { error: "We could not save your message right now." },
        { status: 500 },
      );
    }

    await notifyAdminSafely({
      subject: "New contact message from the website",
      title: "New contact message",
      intro:
        "A visitor submitted the Contact form and the message was saved in Supabase.",
      fields: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Phone / WhatsApp", value: phone },
        { label: "Source", value: source },
        { label: "Message", value: message },
      ],
    });

    return NextResponse.json({
      ok: true,
      title: "Message received.",
      message:
        "Thank you for reaching out. Miriã's team will review your message and follow up soon.",
    });
  } catch (error) {
    console.error("contact route failed", error);
    return NextResponse.json(
      { error: "Supabase is not configured yet or the request could not be sent." },
      { status: 503 },
    );
  }
}
