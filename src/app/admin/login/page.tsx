import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { StudioLogin } from "./StudioLogin";
import { isProviderConfigured } from "@/lib/oauth";
import { staffGoogleEmails } from "@/lib/admin-auth";

const ERRORS: Record<string, string> = {
  staff_google_denied: "That Google account doesn't have access to the studio. Use the passcode, or ask an admin to add it under Settings → Staff access.",
  staff_google_off: "Google sign-in for staff isn't switched on. Use the passcode.",
  cancelled: "Google sign-in was cancelled.",
  expired: "That sign-in attempt expired. Please try again.",
  provider_error: "Google sign-in didn't complete. Please try again.",
};

export const metadata: Metadata = { title: "The Studio · Staff sign-in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  const err = one(sp.error);
  const notice = one(sp.denied) && user ? `You're signed in as ${user.email}, which doesn't have admin access.` : err ? (ERRORS[err] ?? "Sign-in didn't complete. Please try again.") : null;
  const google = (await isProviderConfigured("google")) && (await staffGoogleEmails()).length > 0;
  return <StudioLogin next={one(sp.next)} notice={notice} google={google} />;
}
