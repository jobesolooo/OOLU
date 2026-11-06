import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/account/login">) {
  if (await getCurrentUser()) redirect("/account");
  const raw = (await searchParams).next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="mb-8 font-display text-4xl font-[900] uppercase">Sign in</h1>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
