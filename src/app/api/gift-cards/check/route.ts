import { NextResponse } from "next/server";
import { findActiveGiftCard } from "@/lib/giftcards";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!code.trim() || code.length > 40) return NextResponse.json({ error: "Enter a gift card code." }, { status: 400 });
  const card = await findActiveGiftCard(code);
  if (!card || card.balance <= 0) {
    return NextResponse.json({ error: "That code isn't valid or has no balance left." }, { status: 404 });
  }
  return NextResponse.json({ code: card.code, balance: card.balance, currency: card.currency });
}
