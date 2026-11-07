import type { Metadata } from "next";
import { requireUser, getLinkedProviders } from "@/lib/auth";
import { isProviderConfigured } from "@/lib/oauth";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { AppleIcon, authErrorMessage, GoogleIcon } from "@/components/auth/SocialButtons";
import { disconnectProvider, signOutEverywhere } from "../actions";
import { PasswordForm } from "../settings/SettingsForms";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.security"), robots: { index: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SecurityPage({ searchParams }: PageProps<"/account/security">) {
  const user = await requireUser("/account/security");
  const sp = await searchParams;
  const linked = await getLinkedProviders(user.id);
  const { t } = await getT();
  const err = one(sp.error);
  const notice = one(sp.connected)
    ? t("set.connected", { provider: one(sp.connected) === "google" ? "Google" : "Apple" })
    : one(sp.disconnected)
      ? t("set.disconnected")
      : authErrorMessage(err, t);
  // Only show providers that are set up, plus any already linked.
  const providers = [
    { id: "google" as const, name: "Google", Icon: GoogleIcon },
    { id: "apple" as const, name: "Apple", Icon: AppleIcon },
  ].filter((p) => isProviderConfigured(p.id) || linked.includes(p.id));
  const btn = "border border-black/20 px-4 py-2.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:border-ink";

  return (
    <AccountShell user={user} active="security" title={t("ac.nav.security")} notice={notice}>
      <AccountSection n={1} title={user.hasPassword ? t("set.password") : t("set.addPassword")} sub={t("ac.passwordSub")}>
        <AccountCard>
          {!user.hasPassword && (
            <p className="mb-4 text-[14px] text-black/70">{t("set.socialOnly", { providers: linked.map((p) => (p === "google" ? "Google" : "Apple")).join(" / ") })}</p>
          )}
          <PasswordForm hasPassword={user.hasPassword} />
        </AccountCard>
      </AccountSection>

      <AccountSection n={2} title={t("set.methods")} sub={t("ac.methodsSub")}>
        <ul className="divide-y divide-black/10 bg-white ring-1 ring-black/5">
          <li className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <span className="text-[15px]">{t("set.emailPassword")}</span>
            <span className="text-[12px] text-ash">{user.hasPassword ? t("set.on") : t("set.off")}</span>
          </li>
          {providers.map(({ id, name, Icon }) => {
            const on = linked.includes(id);
            return (
              <li key={id} className="flex items-center justify-between gap-4 p-5 sm:p-6">
                <span className="flex items-center gap-3 text-[15px]">
                  <Icon className="size-5" /> {name}
                  <span className="text-[12px] text-ash">{on ? t("set.isConnected") : t("set.notConnected")}</span>
                </span>
                {on ? (
                  <form action={disconnectProvider}>
                    <input type="hidden" name="provider" value={id} />
                    <button className={btn}>{t("set.disconnect")}</button>
                  </form>
                ) : (
                  <a href={`/api/auth/${id}?link=1`} className={btn}>
                    {t("set.connect")}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </AccountSection>

      <AccountSection n={3} title={t("set.devices")} sub={t("set.devicesBody")}>
        <AccountCard>
          <form action={signOutEverywhere}>
            <button className={btn}>{t("set.signOutAll")}</button>
          </form>
        </AccountCard>
      </AccountSection>
    </AccountShell>
  );
}
