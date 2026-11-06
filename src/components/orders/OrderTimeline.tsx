import { Check } from "lucide-react";
import type { Order } from "@/lib/db/schema";
import { cx, formatDate } from "@/lib/format";

const CARRIER_URLS: Record<string, (n: string) => string> = {
  postnl: (n) => `https://jouw.postnl.nl/track-and-trace/${encodeURIComponent(n)}`,
  dhl: (n) => `https://www.dhl.com/global-en/home/tracking/tracking-parcel.html?tracking-id=${encodeURIComponent(n)}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  dpd: (n) => `https://tracking.dpd.de/status/en_US/parcel/${encodeURIComponent(n)}`,
};

export function trackingUrl(carrier: string | null, number: string | null) {
  if (!carrier || !number) return null;
  const fn = CARRIER_URLS[carrier.toLowerCase().replace(/\s+/g, "")];
  return fn ? fn(number) : null;
}

export function OrderTimeline({ order }: { order: Order }) {
  const rank = { paid: 1, partially_refunded: 1, fulfilled: 2, shipped: 3, delivered: 4 } as Record<string, number>;
  const at = rank[order.status] ?? (order.deliveredAt ? 4 : order.shippedAt ? 3 : 1);
  const steps = [
    { label: "Order placed", date: order.paidAt ?? order.createdAt },
    { label: "Packed", date: null },
    { label: "Shipped", date: order.shippedAt },
    { label: "Delivered", date: order.deliveredAt },
  ];
  const url = trackingUrl(order.trackingCarrier, order.trackingNumber);

  if (order.status === "refunded" || order.status === "cancelled") {
    return <p className="bg-white p-5 text-sm">This order was {order.status}.</p>;
  }

  return (
    <div className="bg-white p-6">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const done = i < at;
          return (
            <li key={s.label} className="relative">
              {i > 0 && <span className={cx("absolute top-3.5 right-1/2 left-[-50%] h-px", done ? "bg-ink" : "bg-black/15")} aria-hidden />}
              <span
                className={cx(
                  "relative mx-auto grid size-7 place-items-center rounded-full border",
                  done ? "border-ink bg-ink text-white" : "border-black/20 bg-white",
                )}
              >
                {done && <Check className="size-3.5" />}
              </span>
              <p className={cx("mt-3 text-center text-[11px] font-semibold tracking-[0.1em] uppercase sm:text-xs", !done && "text-ash")}>{s.label}</p>
              {done && s.date && <p className="mt-1 text-center text-[11px] text-ash">{formatDate(s.date)}</p>}
            </li>
          );
        })}
      </ol>
      {order.trackingNumber && (
        <p className="mt-6 border-t border-black/10 pt-4 text-sm">
          {order.trackingCarrier} tracking:{" "}
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              {order.trackingNumber}
            </a>
          ) : (
            <strong>{order.trackingNumber}</strong>
          )}
        </p>
      )}
    </div>
  );
}
