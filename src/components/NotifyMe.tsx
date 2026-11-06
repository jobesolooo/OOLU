"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";

export function NotifyMe({ productId, size, label }: { productId: string; size: string; label: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, productId, size }),
    });
    if (res.ok) setState("done");
    else {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 border border-black/15 bg-white p-4 text-sm">
        <Check className="size-4" /> We&apos;ll email {email} the moment it&apos;s available.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-black/15 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Bell className="size-4" strokeWidth={1.5} /> {label}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email"
          className="input py-3"
        />
        <button className="btn-solid shrink-0 px-5" disabled={state === "sending"}>
          {state === "sending" ? "…" : "Notify me"}
        </button>
      </div>
      {state === "error" && <p className="text-xs text-red-700">{error}</p>}
    </form>
  );
}
