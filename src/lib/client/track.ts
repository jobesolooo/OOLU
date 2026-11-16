/**
 * Sends one store-activity event to /api/t (see src/lib/analytics.ts). Fire-and-forget:
 * uses sendBeacon so it never slows the page down or blocks navigation.
 */
export type TrackType = "pageview" | "click" | "add_to_cart" | "wishlist_add" | "search";

export function track(t: TrackType, data: { pid?: string; l?: string; v?: number; r?: string } = {}) {
  if (typeof window === "undefined") return;
  if (location.pathname.startsWith("/admin")) return;
  const body = JSON.stringify({ t, p: location.pathname + location.search, ...data });
  try {
    if (navigator.sendBeacon?.(new URL("/api/t", location.origin), new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/t", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
}
