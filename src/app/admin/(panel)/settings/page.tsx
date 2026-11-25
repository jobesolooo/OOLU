import Link from "next/link";
import { Building2, Home, KeyRound, ListChecks, Mail, Search, Users } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { saveStoreSettings } from "../actions";
import { AdminForm } from "../FormMessage";
import { AdminHeader } from "../ui";
import { StripeSetup } from "../StripeSetup";
import { AuthSetup } from "../AuthSetup";
import { keyStates } from "@/lib/keys";
import { KEY_GROUPS } from "@/lib/keys-catalog";
import { getSession } from "@/lib/session";
import { cx } from "@/lib/format";
import { AccountKeys, SecurityLock } from "./AccountKeys";
import { BusinessDetails } from "./BusinessDetails";
import { SignInAccess } from "./SignInAccess";
import { HashTab } from "./HashTab";
import { SearchVisibility } from "./SearchVisibility";

export const dynamic = "force-dynamic";

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
/** Stored end moment (midnight Amsterdam) back to the calendar day it was picked as. */
const holidayDate = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 3600_000).toISOString().slice(0, 10) : "");

/** One tab per area; `lock` = needs the staff passcode for some changes, so the security lock shows there. */
const TABS = [
  { id: "business", label: "Business", Icon: Building2, blurb: "Name, company details, socials, shipping and returns.", lock: false },
  { id: "email", label: "Email", Icon: Mail, blurb: "The shop's email addresses, forwarding, and sending/receiving setup.", lock: true },
  { id: "keys", label: "Account keys", Icon: KeyRound, blurb: "Keys for Stripe, email, Google, Apple and scheduled drops.", lock: true },
  { id: "signin", label: "Sign-in & staff", Icon: Users, blurb: "Customer sign-in buttons, staff passcode and Google sign-in for staff.", lock: true },
  { id: "seo", label: "Google & SEO", Icon: Search, blurb: "How the shop shows up in Google: verification, sitemap, Shopping feed and what's left to do.", lock: false },
  { id: "homepage", label: "Homepage", Icon: Home, blurb: "Promo strip, drop countdown and newsletter popup.", lock: false },
  { id: "guides", label: "Setup guides", Icon: ListChecks, blurb: "What's connected, and where to find anything that's still missing.", lock: false },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/settings">) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab) ?? TABS[0];
  const [s, session] = await Promise.all([getSettings(), getSession()]);
  const unlockedUntil = session.keysUntil ?? null; // the screen itself works out whether it has expired

  return (
    <>
      <HashTab current={tab.id} />
      <AdminHeader eyebrow="Setup" title="Store settings" description="Fill in a field, press save, and it's live on the store straight away." />

      <nav aria-label="Settings sections" className="no-scrollbar -mx-1 mb-6 flex max-w-4xl gap-1 overflow-x-auto border-b border-black/10 px-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/settings?tab=${t.id}`}
            scroll={false}
            aria-current={t.id === tab.id ? "page" : undefined}
            className={cx(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[12px] font-medium whitespace-nowrap transition-colors sm:px-4",
              t.id === tab.id ? "border-ink text-ink" : "border-transparent text-ash hover:text-ink",
            )}
          >
            <t.Icon className="size-4" strokeWidth={1.6} /> {t.label}
          </Link>
        ))}
      </nav>

      <div className="max-w-3xl">
        <p className="mb-4 text-[12px] text-ash">{tab.blurb}</p>
        {tab.lock && (
          // Stays in view while scrolling; below the phone header bar, at the very top on desktop.
          <div className="sticky top-[60px] z-30 mb-4 scroll-mt-24 lg:top-0">
            <SecurityLock unlockedUntil={unlockedUntil} />
          </div>
        )}
        <TabBody tab={tab.id} s={s} unlockedUntil={unlockedUntil} />
      </div>
    </>
  );
}

async function TabBody({ tab, s, unlockedUntil }: { tab: TabId; s: Awaited<ReturnType<typeof getSettings>>; unlockedUntil: number | null }) {
  switch (tab) {
    case "email":
      return <BusinessDetails part="email" />;
    case "keys":
      return <AccountKeys groups={KEY_GROUPS} states={await keyStates()} unlockedUntil={unlockedUntil} host={process.env.VERCEL ? "Vercel" : ".env.local"} />;
    case "signin":
      return <SignInAccess />;
    case "seo":
      return <SearchVisibility />;
    case "homepage":
      return (
      <AdminForm action={saveStoreSettings} submitLabel="Save homepage" className="space-y-3">
        <fieldset className="min-w-0 space-y-3 bg-white [&>legend~*]:clear-both p-6 ring-1 ring-black/5">
          <legend className="float-left mb-1 w-full text-[11px] font-semibold tracking-[0.14em] uppercase">Christmas theme</legend>
          <p className="text-xs text-ash">
            Snow over the homepage photo, a holiday headline and promo, holiday lines in the scrolling strip and a gift card section. It switches itself off on
            the end date, so there is nothing to undo after the holidays. Empty text fields use the built-in copy in every language.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="holidayEnabled" defaultChecked={s.holiday.enabled} /> Show the Christmas theme
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
            <label className="text-xs text-ash">
              Switches off on (Amsterdam time)
              <input name="holidayUntil" type="date" defaultValue={holidayDate(s.holiday.until)} className="input mt-1" />
            </label>
            <label className="text-xs text-ash">
              Headline (optional)
              <input name="holidayTitle" defaultValue={s.holiday.title} maxLength={60} placeholder="Gift the journey." className="input mt-1" />
            </label>
            <label className="text-xs text-ash">
              Promo strip text (optional)
              <input name="holidayMessage" defaultValue={s.holiday.message} maxLength={140} placeholder="Christmas gifting is open…" className="input mt-1" />
            </label>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-3 bg-white [&>legend~*]:clear-both p-6 ring-1 ring-black/5">
          <legend className="float-left mb-3 w-full text-[11px] font-semibold tracking-[0.14em] uppercase">Promo strip (under the homepage hero)</legend>
          <input name="announcement" defaultValue={s.announcement} maxLength={140} className="input" />
        </fieldset>

        <fieldset className="min-w-0 space-y-3 bg-white [&>legend~*]:clear-both p-6 ring-1 ring-black/5">
          <legend className="float-left mb-1 w-full text-[11px] font-semibold tracking-[0.14em] uppercase">Drop countdown (homepage)</legend>
          <p className="text-xs text-ash">Leave the launch time empty to count down to the next product with a release date.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="bannerEnabled" defaultChecked={s.dropBanner.enabled} /> Show the countdown banner
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            <input name="eyebrow" defaultValue={s.dropBanner.eyebrow} placeholder="Eyebrow, e.g. Next drop" className="input" />
            <input name="title" defaultValue={s.dropBanner.title} placeholder="Title" className="input" />
            <label className="text-xs text-ash">
              Launch time in UTC (Amsterdam is UTC+1 in winter, +2 in summer)
              <input name="launchAt" type="datetime-local" defaultValue={toLocalInput(s.dropBanner.launchAt)} className="input mt-1" />
            </label>
            <label className="text-xs text-ash">
              Button link
              <input name="href" defaultValue={s.dropBanner.href} className="input mt-1" />
            </label>
          </div>
          <textarea name="body" defaultValue={s.dropBanner.body} rows={2} className="input" />
        </fieldset>

        <fieldset className="min-w-0 space-y-3 bg-white [&>legend~*]:clear-both p-6 ring-1 ring-black/5">
          <legend className="float-left mb-1 w-full text-[11px] font-semibold tracking-[0.14em] uppercase">Newsletter popup</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="popupEnabled" defaultChecked={s.popup.enabled} /> Show the popup to new visitors
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            <label className="text-xs text-ash">
              Welcome discount (%)
              <input name="percentOff" type="number" min={1} max={90} defaultValue={s.popup.percentOff} className="input mt-1" />
            </label>
            <label className="text-xs text-ash">
              Show after (seconds)
              <input name="delaySeconds" type="number" min={0} max={120} defaultValue={s.popup.delaySeconds} className="input mt-1" />
            </label>
          </div>
        </fieldset>
      </AdminForm>
      );
    case "guides":
      return (
        <div className="space-y-3">
          <StripeSetup />
          <AuthSetup />
        </div>
      );
    default:
      return <BusinessDetails part="details" />;
  }
}
