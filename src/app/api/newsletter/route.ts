import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { createWelcomeCode } from "@/lib/promotions";
import { sendNewsletterWelcome } from "@/lib/email";
import { getSettings } from "@/lib/settings";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), source: z.string().max(40).optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const { email, source } = parsed.data;

  const db = await getDb();
  const [existing] = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, email)).limit(1);
  if (existing && !existing.unsubscribedAt) {
    return NextResponse.json({ ok: true, already: true, code: null });
  }

  const { popup } = await getSettings();
  let code: string | null = null;
  // Only first-time subscribers get a welcome code.
  if (!existing) {
    try {
      code = await createWelcomeCode(email, popup.percentOff);
    } catch (err) {
      console.error("[newsletter] could not create welcome code", err);
    }
  }

  if (existing) {
    await db.update(schema.subscribers).set({ unsubscribedAt: null }).where(eq(schema.subscribers.id, existing.id));
  } else {
    await db.insert(schema.subscribers).values({ email, promoCode: code, source: source ?? "site" });
  }
  await sendNewsletterWelcome(email, code, popup.percentOff);
  return NextResponse.json({ ok: true, code });
}
