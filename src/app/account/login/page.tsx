import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { authErrorMessage, OrDivider, SocialButtons } from "@/components/auth/SocialButtons";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({ searchParams }: PageProps<"/account/login">) {
  const sp = await searchParams;
  const next = one(sp.next);
  if (await getCurrentUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/account");
  const error = authErrorMessage(one(sp.error));
  return (
    <AuthShell eyebrow="Welcome back" title="Sign in">
      {one(sp.signedout) && <p className="mb-6 bg-white p-4 text-[13px]">You&apos;ve been signed out on all devices.</p>}
      {error && <p className="mb-6 border border-red-200 bg-red-50 p-4 text-[13px] text-red-800" role="alert">{error}</p>}
      <SocialButtons next={next} mode="login" />
      <OrDivider />
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
