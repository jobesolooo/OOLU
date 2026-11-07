import { getSettings } from "@/lib/settings";
import { saveStoreSettings } from "../actions";
import { AdminForm } from "../FormMessage";
import { AdminHeader } from "../ui";
import { StripeSetup } from "../StripeSetup";
import { AuthSetup } from "../AuthSetup";

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <>
      <AdminHeader eyebrow="Setup" title="Store settings" description="Homepage promo strip, drop countdown and the newsletter popup. Changes show on the store straight away." />
      <div className="mb-3 max-w-3xl space-y-3">
        <StripeSetup />
        <AuthSetup />
      </div>
      <AdminForm action={saveStoreSettings} submitLabel="Save settings" className="max-w-3xl space-y-3">
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
    </>
  );
}
