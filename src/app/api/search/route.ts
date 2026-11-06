import { NextResponse } from "next/server";
import { isUpcoming, queryProducts } from "@/lib/catalog";
import { allVariantKeys } from "@/lib/variants";

/** Instant search for the header search modal: top matches, lightweight fields only. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ q, total: 0, results: [] });
  const list = await queryProducts({ q });
  const results = list.slice(0, 8).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0] ?? null,
    image2: p.images[1] ?? null,
    category: p.category,
    unitAmount: p.unitAmount,
    compareAtAmount: p.compareAtAmount,
    currency: p.currency,
    soldOut: !isUpcoming(p) && p.soldOut.length > 0 && allVariantKeys(p).every((k) => p.soldOut.includes(k)),
  }));
  return NextResponse.json({ q, total: list.length, results }, { headers: { "Cache-Control": "public, max-age=30" } });
}
