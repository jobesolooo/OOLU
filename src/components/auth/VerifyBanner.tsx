"use client";

import { useT, useTx } from "../Prefs";
import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { resendVerification } from "@/app/account/actions";

export function VerifyBanner({ email }: { email: string }) {
  const t = useT();
  const tx = useTx();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="bg-amber-50 text-amber-950">
      <div className="container-x flex flex-wrap items-center gap-x-4 gap-y-2 py-4 text-sm">
        <MailWarning className="size-5 shrink-0" strokeWidth={1.5} />
        <p className="flex-1">
          {t("verify.text1")} <strong>{email}</strong> {t("verify.text2")}
        </p>
        {msg ? (
          <span className="text-xs">{tx(msg)}</span>
        ) : (
          <button
            className="text-xs font-semibold tracking-[0.12em] uppercase underline underline-offset-4"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await resendVerification();
                setMsg(r?.ok ?? r?.error ?? t("verify.sent"));
              })
            }
          >
            {pending ? t("common.sending") : t("verify.resend")}
          </button>
        )}
      </div>
    </div>
  );
}
