import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/account";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { DetailsForm, EmailForm } from "../forms";
import { cancelEmailChange } from "../manage";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.profile"), robots: { index: false } };
}

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const profile = await getProfile(user.id);
  const { t } = await getT();
  if (!profile) return null;
  return (
    <AccountShell user={user} active="profile" title={t("ac.nav.profile")}>
      <AccountSection n={1} title={t("ac.personal")} sub={t("ac.personalSub")}>
        <AccountCard>
          <DetailsForm user={profile} />
        </AccountCard>
      </AccountSection>

      <AccountSection n={2} id="email" title={t("auth.email")} sub={t("ac.emailSub")}>
        <AccountCard className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase">{t("ac.currentEmail")}</p>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-[15px]">
              <span className="break-all">{user.email}</span>
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700">
                  <BadgeCheck className="size-4" /> {t("set.confirmed")}
                </span>
              ) : (
                <span className="text-[12px] text-amber-700">{t("set.notConfirmed")}</span>
              )}
            </p>
          </div>
          {profile.pendingEmail && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-accent bg-mist p-4 text-[13px]">
              <span>{t("ac.pendingEmail", { email: profile.pendingEmail })}</span>
              <form action={cancelEmailChange}>
                <button className="text-[11px] tracking-[0.08em] uppercase underline underline-offset-4">{t("ac.cancel")}</button>
              </form>
            </div>
          )}
          <div className="border-t border-black/10 pt-6">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.1em] uppercase">{t("ac.changeEmail")}</p>
            <EmailForm hasPassword={user.hasPassword} />
          </div>
        </AccountCard>
      </AccountSection>
    </AccountShell>
  );
}
