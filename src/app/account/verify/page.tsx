import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "../actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.confirmMeta"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: PageProps<"/account/verify">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const ok = token ? await verifyEmailToken(token) : false;
  const { t } = await getT();
  return (
    <AuthShell eyebrow={t("auth.account")} title={ok ? t("auth.confirmed") : t("auth.expired")}>
      <div className="flex items-start gap-4">
        {ok ? <CheckCircle2 className="size-8 shrink-0" strokeWidth={1.3} /> : <XCircle className="size-8 shrink-0" strokeWidth={1.3} />}
        <p className="text-[15px] leading-relaxed text-black/75">
          {ok ? t("auth.confirmedBody") : t("auth.expiredBody")}
        </p>
      </div>
      <Link href="/account" className="btn-solid mt-8">{t("auth.goAccount")}</Link>
    </AuthShell>
  );
}
