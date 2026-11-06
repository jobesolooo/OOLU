import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireUser, getLinkedProviders } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { isProviderConfigured } from "@/lib/oauth";
import { AccountShell } from "@/components/auth/AccountShell";
import { AppleIcon, authErrorMessage, GoogleIcon } from "@/components/auth/SocialButtons";
import { disconnectProvider, setNewsletter, signOutEverywhere } from "../actions";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Profile & security", robots: { index: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SettingsPage({ searchParams }: PageProps<"/account/settings">) {
  const user = await requireUser("/account/settings");
  const sp = await searchParams;
  const db = await getDb();
  const [linked, [sub]] = await Promise.all([
    getLinkedProviders(user.id),
    db.select().from(schema.subscribers).where(eq(schema.subscribers.email, user.email)).limit(1),
  ]);
  const subscribed = Boolean(sub && !sub.unsubscribedAt);
  const err = one(sp.error);
  const notice = one(sp.connected)
    ? `${one(sp.connected) === "google" ? "Google" : "Apple"} is now connected. You can use it to sign in.`
    : one(sp.disconnected)
      ? "Disconnected."
      : err === "last_login_method"
        ? "Add a password first — otherwise you'd have no way to sign in."
        : authErrorMessage(err);

  const providers = [
    { id: "google" as const, name: "Google", Icon: GoogleIcon },
    { id: "apple" as const, name: "Apple", Icon: AppleIcon },
  ];

  return (
    <AccountShell user={user} active="settings">
      {notice && <p className={`mb-8 p-5 text-[15px] ${err ? "border border-red-200 bg-red-50 text-red-800" : "bg-white"}`}>{notice}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <ProfileForm name={user.name ?? ""} email={user.email} verified={user.emailVerified} />
        </Card>

        <Card title={user.hasPassword ? "Password" : "Add a password"}>
          {!user.hasPassword && <p className="mb-4 text-sm text-black/70">You sign in with {linked.map((p) => (p === "google" ? "Google" : "Apple")).join(" / ")}. Add a password to also sign in with email.</p>}
          <PasswordForm hasPassword={user.hasPassword} />
        </Card>

        <Card title="Sign-in methods">
          <ul className="divide-y divide-black/10">
            {providers.map(({ id, name, Icon }) => {
              const on = linked.includes(id);
              return (
                <li key={id} className="flex items-center justify-between gap-4 py-4">
                  <span className="flex items-center gap-3 text-[15px]">
                    <Icon className="size-5" /> {name}
                    <span className="text-xs text-ash">{on ? "Connected" : "Not connected"}</span>
                  </span>
                  {on ? (
                    <form action={disconnectProvider}>
                      <input type="hidden" name="provider" value={id} />
                      <button className="text-xs underline underline-offset-4">Disconnect</button>
                    </form>
                  ) : (
                    <a
                      href={`/api/auth/${id}?link=1`}
                      className={`border border-black/20 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase hover:border-ink ${isProviderConfigured(id) ? "" : "pointer-events-none opacity-40"}`}
                      aria-disabled={!isProviderConfigured(id)}
                    >
                      Connect
                    </a>
                  )}
                </li>
              );
            })}
            <li className="flex items-center justify-between gap-4 py-4 text-[15px]">
              <span>Email + password</span>
              <span className="text-xs text-ash">{user.hasPassword ? "On" : "Off"}</span>
            </li>
          </ul>
        </Card>

        <Card title="Emails">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-black/75">Drops, restocks and offers. Order emails always arrive.</p>
            <form action={setNewsletter}>
              <input type="hidden" name="on" value={String(!subscribed)} />
              <button
                role="switch"
                aria-checked={subscribed}
                aria-label="Marketing emails"
                className={`relative h-7 w-12 rounded-full transition-colors ${subscribed ? "bg-ink" : "bg-black/20"}`}
              >
                <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${subscribed ? "left-6" : "left-1"}`} />
              </button>
            </form>
          </div>
        </Card>

        <Card title="Devices">
          <p className="mb-4 text-sm text-black/75">Signed in on a shared or lost device? Sign out everywhere, including here.</p>
          <form action={signOutEverywhere}>
            <button className="border border-black/20 px-5 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase hover:border-ink">Sign out of all devices</button>
          </form>
        </Card>

        <Card title="Delete account">
          <DeleteAccountForm />
        </Card>
      </div>
    </AccountShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white p-6 sm:p-8">
      <h2 className="label mb-5 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
