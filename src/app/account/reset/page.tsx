import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "./ResetForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.newPwMeta"), robots: { index: false } };
}

export default async function ResetPage({ searchParams }: PageProps<"/account/reset">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const { t } = await getT();
  return (
    <AuthShell eyebrow={t("auth.account")} title={t("auth.newPwTitle")}>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-[15px]">
          {t("auth.missingToken")} <Link href="/account/forgot" className="underline">{t("auth.requestNew")}</Link>.
        </p>
      )}
    </AuthShell>
  );
}
