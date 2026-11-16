import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/catalog";
import { deviceOf, recordEvent, shouldTrack, sourceOf, visitorId } from "@/lib/analytics";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Store activity beacon (navigator.sendBeacon from the Analytics component).
 * Always answers 204 so it never shows up as an error in the browser.
 */
const Body = z.object({
  t: z.enum(["pageview", "click", "add_to_cart", "wishlist_add", "search"]),
  p: z.string().max(500), // path + query of the page
  r: z.string().max(500).optional(), // document.referrer (first page view only)
  pid: z.string().max(80).optional(),
  l: z.string().max(200).optional(),
  v: z.number().int().min(0).max(100_000_000).optional(),
});

const ok = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const h = req.headers;
  if (!shouldTrack(h)) return ok();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`t:${ip}`, 240, 60_000).ok) return ok();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ok();
  const b = parsed.data;

  let url: URL;
  try {
    url = new URL(b.p, req.nextUrl.origin);
  } catch {
    return ok();
  }
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return ok();

  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "admin") return ok(); // staff browsing the shop shouldn't skew the numbers

  let productId = b.pid ?? null;
  if (!productId && b.t === "pageview" && url.pathname.startsWith("/products/")) {
    productId = (await getProductBySlug(decodeURIComponent(url.pathname.split("/")[2] ?? "")).catch(() => null))?.id ?? null;
  }
  const { source, referrer } = b.t === "pageview" ? sourceOf(url, b.r ?? null, req.nextUrl.hostname) : { source: null, referrer: null };

  try {
    await recordEvent({
      type: b.t,
      path: url.pathname, // the query string isn't stored (searches are their own events)
      visitor: visitorId(h),
      userId: user?.id ?? null,
      productId,
      label: b.l?.replace(/\s+/g, " ").trim() || null,
      value: b.v ?? null,
      source,
      referrer,
      device: deviceOf(h.get("user-agent") ?? ""),
      country: h.get("x-vercel-ip-country"),
    });
  } catch (err) {
    console.error("[analytics] couldn't record event", err);
  }
  return ok();
}
