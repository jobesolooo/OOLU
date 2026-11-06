import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { OrDivider, SocialButtons } from "@/components/auth/SocialButtons";

export const metadata: Metadata = { title: "Join the movement", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/account/register">) {
  if (await getCurrentUser()) redirect("/account");
  const raw = (await searchParams).next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  return (
    <AuthShell eyebrow="Join the movement" title="Create account">
      <ul className="mb-8 space-y-2 text-[13px] text-black/75">
        {["Track orders and start returns in two taps", "Wishlist saved across all your devices", "Early access to drops"].map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="size-4 shrink-0" /> {b}
          </li>
        ))}
      </ul>
      <SocialButtons next={next} mode="register" />
      <OrDivider />
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
