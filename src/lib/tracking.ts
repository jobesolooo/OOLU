/** Carrier tracking pages (used by the order timeline and shipping emails). */
export const CARRIER_URLS: Record<string, (n: string) => string> = {
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

