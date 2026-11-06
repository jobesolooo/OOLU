import { NextResponse } from "next/server";
import { notifyReleasedDrops } from "@/lib/alerts";

/**
 * Emails "it's live" alerts for drops whose release time has passed.
 * Runs hourly on Vercel (see vercel.json). Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const sent = await notifyReleasedDrops();
  return NextResponse.json({ sent });
}
