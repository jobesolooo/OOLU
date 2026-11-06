import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { CaveLogin } from "./CaveLogin";

export const metadata: Metadata = { title: "Staff sign-in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  const notice = one(sp.denied) && user ? `You're signed in as ${user.email}, which doesn't have admin access.` : null;
  return <CaveLogin next={one(sp.next)} notice={notice} />;
}
