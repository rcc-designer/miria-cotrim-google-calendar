import { NextResponse } from "next/server";
import { cleanString, getSupabaseAdmin, isValidEmail } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = cleanString(body.name);
    const email = cleanString(body.email).toLowerCase();
    const source = cleanString(body.source) || "beauty_list";
    const consent =
      body.consent === true ||
      body.consent === "true" ||
      body.consent === "on";

    if (!email) {
      return NextResponse.json(
        { error: "Please enter your email address." },
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
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email,
          name,
          source,
          consent,
        },
        { onConflict: "email" },
      );

    if (error) {
      console.error("newsletter_subscribers upsert failed", error);
      return NextResponse.json(
        { error: "We could not save your subscription right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("newsletter route failed", error);
    return NextResponse.json(
      { error: "Supabase is not configured yet or the request could not be sent." },
      { status: 503 },
    );
  }
}
