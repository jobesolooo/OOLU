import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "../actions";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Confirm email", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: PageProps<"/account/verify">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const ok = token ? await verifyEmailToken(token) : false;
  return (
    <AuthShell eyebrow="Account" title={ok ? "Email confirmed" : "Link expired"}>
      <div className="flex items-start gap-4">
        {ok ? <CheckCircle2 className="size-8 shrink-0" strokeWidth={1.3} /> : <XCircle className="size-8 shrink-0" strokeWidth={1.3} />}
        <p className="text-[15px] leading-relaxed text-black/75">
          {ok
            ? "Thanks — your email is confirmed. Any orders you placed as a guest with this email are now in your account."
            : "This confirmation link is invalid, expired or already used. Sign in and request a new one from your account."}
        </p>
      </div>
      <Link href="/account" className="btn-solid mt-8">Go to my account</Link>
    </AuthShell>
  );
}
