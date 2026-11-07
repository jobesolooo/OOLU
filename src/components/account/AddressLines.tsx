import type { Address } from "@/lib/db/schema";

/** An address as it's written on a parcel. */
export function AddressLines({ address, locale }: { address: Pick<Address, "name" | "line1" | "line2" | "postalCode" | "city" | "region" | "country" | "phone" | "label">; locale: string }) {
  const country = new Intl.DisplayNames([locale, "en"], { type: "region" }).of(address.country) ?? address.country;
  return (
    <address className="text-[14px] leading-[1.7] not-italic">
      {address.label && <span className="mb-1 block text-[11px] tracking-[0.08em] text-ash uppercase">{address.label}</span>}
      <span className="block font-medium">{address.name}</span>
      <span className="block">{address.line1}</span>
      {address.line2 && <span className="block">{address.line2}</span>}
      <span className="block">
        {address.postalCode} {address.city}
        {address.region ? `, ${address.region}` : ""}
      </span>
      <span className="block">{country}</span>
      {address.phone && <span className="mt-1 block text-ash">{address.phone}</span>}
    </address>
  );
}
