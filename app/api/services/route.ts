import { NextResponse } from "next/server";
import { listBookingServices } from "@/lib/availability";
import { tryGetSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const services = await listBookingServices(tryGetSupabaseAdmin());
    return NextResponse.json({ services });
  } catch (error) {
    console.error("services route failed", error);
    return NextResponse.json(
      { error: "We could not load services right now." },
      { status: 500 },
    );
  }
}
