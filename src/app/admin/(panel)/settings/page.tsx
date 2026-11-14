import { getSettings } from "@/lib/settings";
import { saveStoreSettings } from "../actions";
import { AdminForm } from "../FormMessage";
import { AdminHeader } from "../ui";
import { StripeSetup } from "../StripeSetup";
import { AuthSetup } from "../AuthSetup";
import { keyStates } from "@/lib/keys";
import { KEY_GROUPS } from "@/lib/keys-catalog";
import { getSession } from "@/lib/session";
import { AccountKeys, SecurityLock } from "./AccountKeys";
import { BusinessDetails } from "./BusinessDetails";

export const dynamic = "force-dynamic";

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default async function SettingsAdmin() {
  const [s, states, session] = await Promise.all([getSettings(), keyStates(), getSession()]);
  const unlockedUntil = session.keysUntil ?? null; // the screen itself works out whether it has expired
  return (
    <>
      <AdminHeader eyebrow="Setup" title="Store settings" description="Business details, account keys and homepage options. Fill in a field, press save, and it's live on the store straight away." />
      {/* Stays in view while scrolling; below the phone header bar, at the very top on desktop. */}
      <div className="sticky top-[60px] z-30 mb-4 max-w-3xl scroll-mt-24 lg:top-0">
        <SecurityLock unlockedUntil={unlockedUntil} />
      </div>
      <nav aria-label="Sections" className="no-scrollbar -mx-1 mb-6 flex max-w-3xl gap-1 overflow-x-auto px-1">
        {[
          ["#business", "Business details"],
          ["#keys", "Account keys"],
          ["#homepage", "Homepage"],
          ["#guides", "Setup guides"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase ring-1 ring-black/5 hover:bg-ink hover:text-white">
            {label}
          </a>
        ))}
      </nav>
      <div className="max-w-3xl space-y-12">
        <BusinessDetails />
        <AccountKeys groups={KEY_GROUPS} states={states} unlockedUntil={unlockedUntil} host={process.env.VERCEL ? "Vercel" : ".env.local"} />
        <section id="homepage" className="scroll-mt-6">
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase">Homepage</h2>
      <AdminForm action={saveStoreSettings} submitLabel="Save homepage" className="space-y-3">
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
        </section>
        <section id="guides" className="scroll-mt-6 space-y-3">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Setup guides</h2>
          <p className="text-[12px] text-ash">Where to find each key, and what&apos;s still missing. The ticks update as you save keys above.</p>
          <StripeSetup />
          <AuthSetup />
        </section>
      </div>
    </>
  );
}
