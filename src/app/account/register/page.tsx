import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Join the movement" };

export default async function RegisterPage({ searchParams }: PageProps<"/account/register">) {
  if (await getCurrentUser()) redirect("/account");
  const raw = (await searchParams).next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  return (
    <div className="container-x max-w-md py-16">
      <p className="text-[10px] tracking-[0.3em] text-ash uppercase">Join the movement</p>
      <h1 className="mt-2 mb-8 font-display text-4xl font-[900] uppercase">Create account</h1>
      <AuthForm mode="register" next={next} />
    </div>
  );
}
