import { NextResponse } from "next/server";
import { notifyAdminSafely } from "@/lib/emailNotifications";
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

    await notifyAdminSafely({
      subject: "New Beauty List subscriber",
      title: "New Beauty List subscriber",
      intro:
        "A visitor joined the Beauty List and the subscription was saved in Supabase.",
      fields: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Source", value: source },
        { label: "Consent", value: consent ? "Yes" : "No" },
      ],
    });

    return NextResponse.json({
      ok: true,
      title: "You're on the Beauty List.",
      message:
        "Thank you for joining. You'll receive occasional beauty notes, bridal updates and appointment availability.",
    });
  } catch (error) {
    console.error("newsletter route failed", error);
    return NextResponse.json(
      { error: "Supabase is not configured yet or the request could not be sent." },
      { status: 503 },
    );
  }
}
