import { getSettings } from "@/lib/settings";
import { saveStoreSettings } from "../actions";
import { AdminForm } from "../FormMessage";

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-[900] uppercase">Store settings</h1>
      <AdminForm action={saveStoreSettings} submitLabel="Save settings" className="max-w-3xl space-y-6">
        <fieldset className="space-y-3 bg-white p-6">
          <legend className="label float-left mb-3 w-full font-semibold">Announcement bar</legend>
          <input name="announcement" defaultValue={s.announcement} maxLength={140} className="input" />
        </fieldset>

        <fieldset className="space-y-3 bg-white p-6">
          <legend className="label float-left mb-1 w-full font-semibold">Drop countdown (homepage)</legend>
          <p className="text-xs text-ash">Leave the launch time empty to count down to the next product with a release date.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="bannerEnabled" defaultChecked={s.dropBanner.enabled} /> Show the countdown banner
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
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

        <fieldset className="space-y-3 bg-white p-6">
          <legend className="label float-left mb-1 w-full font-semibold">Newsletter popup</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="popupEnabled" defaultChecked={s.popup.enabled} /> Show the popup to new visitors
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
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
