import { NextResponse } from "next/server";
import { cleanString, getSupabaseAdmin, isValidEmail } from "@/lib/supabaseServer";

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("bridal route failed", error);
    return NextResponse.json(
      { error: "Supabase is not configured yet or the request could not be sent." },
      { status: 503 },
    );
  }
}
