import { BIZ_GROUPS, type BizKey } from "@/lib/business-catalog";
import { bizDefaults, getSavedBusiness } from "@/lib/business";
import { AdminForm } from "../FormMessage";
import { saveBusinessDetails } from "./business-actions";
import { EmailSetup } from "./EmailSetup";
import type { BizGroup } from "@/lib/business-catalog";

const TYPE: Record<string, string> = { email: "email", tel: "tel", url: "url", money: "text", number: "number" };

/** Every business detail the site shows, in one form. Empty = the default (shown greyed out). */
/** part: "details" = brand, company, socials, shipping; "email" = email domain, forwarding and setup. */
export async function BusinessDetails({ part = "details" }: { part?: "details" | "email" | "search" }) {
  const [saved, defaults] = await Promise.all([getSavedBusiness(true), Promise.resolve(bizDefaults())]);
  // Socials start filled with the current link, so saving never hides one by accident.
  const value = (k: BizKey) => (k === "instagram" || k === "tiktok" ? (k in saved ? saved[k] : defaults[k]) : saved[k]) ?? "";
  const placeholder = (k: BizKey) => {
    if (k === "tagline") return "Uses the translated tagline";
    if (k === "description") return "Uses the translated description";
    if (k === "city") return "Amsterdam";
    if (k === "hours") return "Default reply hours";
    if (k === "instagram" || k === "tiktok") return "Empty = hidden";
    if (k === "forwardTo") return "e.g. janna@gmail.com";
    if (k === "googleVerify") return '<meta name="google-site-verification" content="…">';
    if (k === "bingVerify") return '<meta name="msvalidate.01" content="…">';
    if (k === "email") return `hello@${saved.emailDomain || defaults.emailDomain}`;
    return defaults[k] || "Not filled in yet";
  };
  const mail = BIZ_GROUPS.find((g) => g.id === "mail");
  const search = BIZ_GROUPS.find((g) => g.id === "search");
  const rest = BIZ_GROUPS.filter((g) => g.id !== "mail" && g.id !== "search");
  const group = (g: BizGroup) => (
    <fieldset key={g.id} id={`biz-${g.id}`} className="min-w-0 scroll-mt-6 bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <legend className="float-left mb-1 w-full text-[11px] font-semibold tracking-[0.14em] uppercase">{g.title}</legend>
      <p className="clear-both mb-4 text-[12px] text-ash">{g.blurb}</p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-4 sm:grid-cols-2">
        {g.fields.map((f) => (
          <label key={f.name} className={f.kind === "textarea" || f.name === "countries" || f.name === "address" ? "sm:col-span-2" : ""}>
            <span className="mb-1 block text-[12px] font-medium">{f.label}</span>
            {f.kind === "textarea" ? (
              <textarea name={f.name} defaultValue={value(f.name)} placeholder={placeholder(f.name)} maxLength={f.max} rows={3} className="input text-[14px]" />
            ) : (
              <input
                name={f.name}
                type={TYPE[f.kind ?? ""] ?? "text"}
                inputMode={f.kind === "money" ? "decimal" : undefined}
                min={f.kind === "number" ? 1 : undefined}
                defaultValue={value(f.name)}
                placeholder={placeholder(f.name)}
                maxLength={f.max}
                className="input text-[14px]"
              />
            )}
            <span className="mt-1 block text-[11px] text-ash">
              {f.help ? `${f.help} · ` : ""}Shows on: {f.shows}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
  const missingLegal = (["legalName", "address", "kvk", "vat", "email"] as BizKey[]).filter((k) => !saved[k]);

  if (part === "search") {
    return (
      <AdminForm action={saveBusinessDetails} submitLabel="Save verification codes" className="space-y-3">
        {search && group(search)}
      </AdminForm>
    );
  }

  if (part === "email") {
    return (
      <section id="email" className="space-y-3">
        <p className="max-w-2xl text-[12px] text-ash">The shop&apos;s own addresses on your domain, where customer mail is forwarded, and whether sending and receiving work.</p>
        <AdminForm action={saveBusinessDetails} submitLabel="Save email settings" className="space-y-3">
          {mail && group(mail)}
        </AdminForm>
        <EmailSetup />
      </section>
    );
  }

  return (
    <section id="business" className="space-y-3">
      <p className="max-w-2xl text-[12px] text-ash">
        Change a detail here and it updates everywhere it appears: footer, contact page, legal pages, checkout, product pages and every email. Live as soon as you save.
      </p>
      {missingLegal.length > 0 && (
        <p className="bg-amber-50 px-4 py-3 text-[12px] text-amber-900 ring-1 ring-amber-600/20">
          The legal pages still show placeholders until the company name, address, KvK, VAT number and customer service email are filled in.
        </p>
      )}
      <AdminForm action={saveBusinessDetails} submitLabel="Save business details" className="space-y-3">
        {rest.map(group)}
      </AdminForm>
    </section>
  );
}
