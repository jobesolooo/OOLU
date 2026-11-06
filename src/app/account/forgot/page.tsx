import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.forgotMeta"), robots: { index: false } };
}

export default async function ForgotPage() {
  const { t } = await getT();
  return (
    <AuthShell eyebrow={t("auth.account")} title={t("auth.resetTitle")}>
      <p className="mb-6 text-[15px] text-black/75">{t("auth.forgotIntro")}</p>
      <ForgotForm />
    </AuthShell>
  );
}
