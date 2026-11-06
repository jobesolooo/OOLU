"use client";

import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { resendVerification } from "@/app/account/actions";

export function VerifyBanner({ email }: { email: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="bg-amber-50 text-amber-950">
      <div className="container-x flex flex-wrap items-center gap-x-4 gap-y-2 py-4 text-sm">
        <MailWarning className="size-5 shrink-0" strokeWidth={1.5} />
        <p className="flex-1">
          Confirm <strong>{email}</strong> to link past guest orders and secure your account.
        </p>
        {msg ? (
          <span className="text-xs">{msg}</span>
        ) : (
          <button
            className="text-xs font-semibold tracking-[0.12em] uppercase underline underline-offset-4"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await resendVerification();
                setMsg(r?.ok ?? r?.error ?? "Sent");
              })
            }
          >
            {pending ? "Sending…" : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}
