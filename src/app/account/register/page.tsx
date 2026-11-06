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
    <AuthShell
      eyebrow="Join the movement"
      title="Create account"
      aside={
        <ul className="mb-[clamp(20px,4vh,40px)] space-y-2 text-[15px] text-white/90">
          {["Track orders and start returns in two taps", "Wishlist saved across all your devices", "Early access to every drop"].map((b) => (
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
