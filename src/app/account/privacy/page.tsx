import type { Metadata } from "next";
import { Download } from "lucide-react";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { setNewsletter } from "../actions";
import { DeleteAccountForm } from "../settings/SettingsForms";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.privacy"), robots: { index: false } };
}

export default async function PrivacyPage() {
  const user = await requireUser("/account/privacy");
  const db = await getDb();
  const [sub] = await db.select().from(schema.subscribers).where(eq(schema.subscribers.email, user.email)).limit(1);
  const subscribed = Boolean(sub && !sub.unsubscribedAt);
  const { t } = await getT();
  return (
    <AccountShell user={user} active="privacy" title={t("ac.nav.privacy")}>
      <AccountSection n={1} title={t("set.emails")} sub={t("ac.emailsSub")}>
        <AccountCard className="flex items-center justify-between gap-6">
          <div>
            <p className="text-[15px]">{t("set.marketing")}</p>
            <p className="mt-1 text-[13px] text-ash">{t("set.emailsBody")}</p>
          </div>
          <form action={setNewsletter}>
            <input type="hidden" name="on" value={String(!subscribed)} />
            <button
              role="switch"
              aria-checked={subscribed}
              aria-label={t("set.marketing")}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${subscribed ? "bg-ink" : "bg-black/20"}`}
            >
              <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${subscribed ? "left-6" : "left-1"}`} />
            </button>
          </form>
        </AccountCard>
      </AccountSection>

      <AccountSection n={2} title={t("ac.yourData")} sub={t("ac.yourDataSub")}>
        <AccountCard className="flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-md text-[14px] leading-relaxed text-black/75">{t("ac.exportBody")}</p>
          <a href="/account/export" className="btn-solid gap-3">
            <Download className="size-4" strokeWidth={1.5} /> {t("ac.download")}
          </a>
        </AccountCard>
      </AccountSection>

      <AccountSection n={3} title={t("set.delete")} sub={t("ac.deleteSub")}>
        <div className="bg-white p-5 ring-1 ring-rose-200 sm:p-7">
          <div className="max-w-md">
            <DeleteAccountForm />
          </div>
        </div>
      </AccountSection>
    </AccountShell>
  );
}
