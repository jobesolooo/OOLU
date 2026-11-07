import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { confirmEmailChange } from "../manage";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Confirm email", robots: { index: false } };

export default async function ConfirmEmailPage({ searchParams }: PageProps<"/account/confirm-email">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const result = token ? await confirmEmailChange(token) : ({ ok: false, reason: "invalid" } as const);
  if (result.ok) redirect("/account?email=1");
  const { t } = await getT();
  return (
    <AuthShell eyebrow={t("ac.eyebrow")} title={t("ac.confirmFailed")}>
      <p className="text-[14px] leading-relaxed text-black/75">{result.reason === "taken" ? t("ac.confirmTaken") : t("ac.confirmInvalid")}</p>
      <Link href="/account/profile#email" className="btn-solid mt-8">
        {t("ac.nav.profile")}
      </Link>
    </AuthShell>
  );
}
