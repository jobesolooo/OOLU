import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ searchParams }: PageProps<"/account/reset">) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  return (
    <AuthShell eyebrow="Account" title="New password">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-[15px]">
          This link is missing its token. <Link href="/account/forgot" className="underline">Request a new one</Link>.
        </p>
      )}
    </AuthShell>
  );
}
