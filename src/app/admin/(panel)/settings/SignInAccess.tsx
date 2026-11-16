import { KeyRound, ShieldCheck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { callbackUrl, isProviderConfigured } from "@/lib/oauth";
import { staffGoogleEmails, staffPasscodeInfo } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";
import { AdminForm } from "../FormMessage";
import { SignInSwitches } from "./SignInSwitches";
import { changeStaffPasscode, saveStaffGoogle } from "./staff-actions";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }) : null;

const codeInput = "input w-full font-mono text-[18px] tracking-[0.4em]";

/** Customer sign-in buttons + staff access (passcode, Google for staff). */
export async function SignInAccess() {
  const [settings, googleReady, appleReady, emails, info, session] = await Promise.all([
    getSettings(),
    isProviderConfigured("google"),
    isProviderConfigured("apple"),
    staffGoogleEmails(),
    staffPasscodeInfo(),
    getSession(),
  ]);
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();
  const viaGoogle = Boolean(session.googleStaffAt && now - session.googleStaffAt < 15 * 60_000);
  const unlocked = Boolean(session.keysUntil && session.keysUntil > now);

  return (
    <section id="signin" className="scroll-mt-28 space-y-3">

      {/* Customer buttons */}
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Customer sign-in buttons</h3>
        <p className="mb-4 text-[12px] text-ash">Choose which buttons customers see next to email sign-in. Changes save as soon as you flip a switch.</p>
        <SignInSwitches
          rows={[
            { id: "google", label: "Google", on: settings.signInButtons.google, ready: googleReady },
            { id: "apple", label: "Apple", on: settings.signInButtons.apple, ready: appleReady },
          ]}
        />
      </div>

      {/* Staff passcode */}
      <div id="staff" className="scroll-mt-28 bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
          <KeyRound className="size-4" /> Staff passcode
        </h3>
        <p className="mb-4 text-[12px] text-ash">
          The 6-digit code for the staff entrance and the security lock.{" "}
          {info.source === "settings"
            ? `Last changed ${when(info.changedAt)}${info.changedBy ? ` by ${info.changedBy}` : ""}.`
            : info.source === "host"
              ? "Currently set in Vercel; once you change it here, the new one is used."
              : "Not set yet."}{" "}
          Changing it signs out every other device signed in as staff.
        </p>
        {viaGoogle && (
          <p className="mb-4 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-900 ring-1 ring-emerald-600/20">
            You signed in with Google, so you can set a new passcode without the current one for the next few minutes.
          </p>
        )}
        <AdminForm action={changeStaffPasscode} submitLabel="Change passcode" className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
            {!viaGoogle && (
              <label className="text-[12px] font-medium">
                Current passcode
                <input name="current" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="current-password" required placeholder="••••••" className={`${codeInput} mt-1`} />
              </label>
            )}
            <label className="text-[12px] font-medium">
              New passcode
              <input name="next" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required placeholder="••••••" className={`${codeInput} mt-1`} />
            </label>
            <label className="text-[12px] font-medium">
              New passcode again
              <input name="confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required placeholder="••••••" className={`${codeInput} mt-1`} />
            </label>
          </div>
          <p className="text-[11px] text-ash">Forgot it? Sign out, choose Continue with Google on the staff entrance (with an account listed below), then set a new one here.</p>
        </AdminForm>
      </div>

      {/* Google for staff */}
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
          <ShieldCheck className="size-4" /> Google sign-in for staff
        </h3>
        <p className="mb-4 text-[12px] text-ash">
          These Google accounts can open the admin panel with <strong className="text-ink">Continue with Google</strong> on the staff entrance, no passcode needed.
          Leave empty to turn it off. Needs the security lock open to change.
        </p>
        {!googleReady && (
          <p className="mb-4 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 ring-1 ring-amber-600/20">
            Add the Google keys under <a href="/admin/settings?tab=keys#keys-google" className="underline">Account keys → Google</a> first; the button appears once they&apos;re set.
          </p>
        )}
        <AdminForm action={saveStaffGoogle} submitLabel="Save staff accounts" className="space-y-2">
          <textarea
            name="emails"
            rows={3}
            defaultValue={emails.join("\n")}
            disabled={!unlocked}
            placeholder={"janna@gmail.com\nayub@gmail.com"}
            className="input font-mono text-[14px] disabled:bg-mist disabled:text-black/50"
          />
          <p className="text-[11px] text-ash">
            One per line. {!unlocked && <a href="#security" className="underline">Unlock with the passcode at the top to edit.</a>} In Google Cloud the OAuth client needs the
            redirect URI <code className="break-all">{callbackUrl("google")}</code> (the same one customers use).
          </p>
        </AdminForm>
      </div>
    </section>
  );
}
