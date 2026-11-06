import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell eyebrow="Account" title="Reset password">
      <p className="mb-6 text-[15px] text-black/75">Enter your email and we&apos;ll send a link to choose a new password. Works for Google and Apple accounts too — it adds a password.</p>
      <ForgotForm />
    </AuthShell>
  );
}
