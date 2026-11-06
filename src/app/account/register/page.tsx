import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { OrDivider, SocialButtons } from "@/components/auth/SocialButtons";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.joinMeta"), robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: PageProps<"/account/register">) {
  if (await getCurrentUser()) redirect("/account");
  const raw = (await searchParams).next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  const { t } = await getT();
  return (
    <AuthShell
      image="/images/brand/made-to-move.jpg"
      eyebrow={t("auth.joinEyebrow")}
      title={t("auth.createAccount")}
      aside={
        <ul className="space-y-2 text-[14px] text-white/90">
          {[t("auth.perk1"), t("auth.perk2"), t("auth.perk3")].map((b) => (
            <li key={b} className="flex items-center gap-3">
              <Check className="size-4 shrink-0" /> {b}
            </li>
          ))}
        </ul>
      }
    >
      <SocialButtons next={next} mode="register" />
      <OrDivider />
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
