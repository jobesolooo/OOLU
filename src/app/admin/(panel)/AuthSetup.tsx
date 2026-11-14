import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { callbackUrl, isProviderConfigured } from "@/lib/oauth";
import { siteUrl, siteUrlNeedsFixing } from "@/lib/site-url";
import { cx } from "@/lib/format";
import { getKeys } from "@/lib/keys";
import { getBusiness } from "@/lib/business";

type Step = { state: "done" | "todo" | "warn"; title: string; body: React.ReactNode };

/** What's needed for every way of signing in, and which parts are done. */
export async function AuthSetup() {
  const site = siteUrl();
  const host = site.replace(/^https?:\/\//, "");
  const [k, b] = await Promise.all([getKeys("RESEND_API_KEY"), getBusiness()]);
  const resend = Boolean(k.RESEND_API_KEY);
  const fromOk = Boolean(b.forwardTo);
  const google = await isProviderConfigured("google");
  const apple = await isProviderConfigured("apple");
  const code = (s: string) => <code className="break-all">{s}</code>;

  const steps: Step[] = [
    {
      state: siteUrlNeedsFixing() ? "warn" : "done",
      title: "Site address",
      body: (
        <>
          Links in emails and the Google/Apple return addresses use {code(site)}.{" "}
          {siteUrlNeedsFixing() && <>Set {code("NEXT_PUBLIC_SITE_URL")} to {code(site)} (or your own domain) in Vercel, then redeploy.</>}
        </>
      ),
    },
    {
      state: "done",
      title: "Email & password",
      body: <>Always on. Customers can create an account, sign in, and stay signed in for 30 days.</>,
    },
    {
      state: resend && fromOk ? "done" : "todo",
      title: "Emails: confirm address, password reset, invites",
      body: (
        <>
          Sent with Resend from the shop&apos;s own addresses ({code(`orders@${b.emailDomain}`)}, {code(`hello@${b.emailDomain}`)} …). Paste a Full access API key under{" "}
          <a href="#keys-email" className="underline">Account keys → Email</a>, then press <strong>Set up email</strong> under{" "}
          <a href="#biz-mail" className="underline">Business details → Email addresses</a> and add the DNS records it shows. Until the domain is verified these emails
          aren&apos;t delivered.
          {resend && !fromOk && <span className="mt-1 block text-amber-700">API key found. Add the inbox to forward mail to under Email addresses.</span>}
        </>
      ),
    },
    {
      state: google ? "done" : "todo",
      title: "Continue with Google",
      body: (
        <>
          Google Cloud Console → APIs &amp; Services → Credentials → OAuth client ID (Web application). Authorised redirect URI: {code(callbackUrl("google"))}. Paste
          the ID and secret under <a href="#keys-google" className="underline">Account keys → Google</a>. The button appears on the sign-in page once both are set.
        </>
      ),
    },
    {
      state: apple ? "done" : "todo",
      title: "Continue with Apple",
      body: (
        <>
          Needs an Apple Developer account. Create a Services ID with Sign in with Apple, domain {code(host)} and return URL {code(callbackUrl("apple"))}, plus a
          Sign in with Apple key (.p8). Fill them in under{" "}
          <a href="#keys-apple" className="underline">Account keys → Apple</a>.
        </>
      ),
    },
    {
      state: process.env.ADMIN_PASSCODE_HASH ? "done" : "warn",
      title: "Staff sign-in (The Studio)",
      body: <>Username {code(process.env.ADMIN_USERNAME ?? "—")} and a 6-digit passcode, stored only as a hash. Change it with {code("npm run admin:passcode")}.</>,
    },
  ];

  return (
    <section className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <h2 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Sign-in &amp; email</h2>
      <p className="mb-5 text-[12px] text-ash">Every way customers and staff sign in. Keys are added under Account keys below and work straight away. The site address and staff passcode stay in Vercel.</p>
      <ol className="space-y-4">
        {steps.map((s) => (
          <li key={s.title} className="flex gap-3">
            {s.state === "done" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" strokeWidth={1.75} />
            ) : s.state === "warn" ? (
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" strokeWidth={1.75} />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-black/25" strokeWidth={1.75} />
            )}
            <div className="min-w-0 text-[13px] leading-relaxed">
              <p className={cx("font-medium", s.state === "done" && "text-ash")}>{s.title}</p>
              <div className="mt-0.5 text-black/70">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
