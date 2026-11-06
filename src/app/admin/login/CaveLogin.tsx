"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { caveAction, type CaveState } from "./actions";

/* ── One-time-code boxes ─────────────────────────────────── */
function CodeBoxes({ onComplete, disabled }: { onComplete: () => void; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => refs.current[0]?.focus(), []);

  const set = (next: string[]) => {
    setDigits(next);
    if (next.every((d) => d !== "")) setTimeout(onComplete, 60);
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={(e) => {
      const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (t.length) {
        e.preventDefault();
        const next = Array.from({ length: 6 }, (_, i) => t[i] ?? "");
        set(next);
        refs.current[Math.min(t.length, 5)]?.focus();
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            const next = [...digits];
            next[i] = v;
            set(next);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
          className="h-16 w-full min-w-0 border border-[#e9e4d8]/25 bg-black/40 text-center font-mono text-3xl text-[#f4efe3] caret-[#e8c58a] transition focus:border-[#e8c58a] focus:bg-black/60 focus:shadow-[0_0_24px_rgba(232,197,138,0.25)] focus:outline-none disabled:opacity-50 sm:h-[72px]"
        />
      ))}
      <input type="hidden" name="code" value={digits.join("")} />
    </div>
  );
}

/* ── Door half ───────────────────────────────────────────── */
function Door({ side }: { side: "l" | "r" }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-y-0 ${side === "l" ? "left-0 cave-door-l" : "right-0 cave-door-r"} w-1/2 overflow-hidden`}
      style={{
        background:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 64px), radial-gradient(120% 80% at 50% 50%, #1d1c1a 0%, #0c0b0a 70%), #0b0a09",
        boxShadow: side === "l" ? "inset -30px 0 60px rgba(0,0,0,0.8)" : "inset 30px 0 60px rgba(0,0,0,0.8)",
      }}
    >
      {/* horizontal plates */}
      {[18, 38, 62, 82].map((t) => (
        <div key={t} className="absolute inset-x-0 h-px bg-white/[0.06]" style={{ top: `${t}%` }} />
      ))}
      {/* bolts */}
      {[18, 38, 62, 82].map((t) =>
        [12, 50, 88].map((l) => (
          <span key={`${t}-${l}`} className="absolute size-2 rounded-full bg-[#2a2824] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" style={{ top: `calc(${t}% - 4px)`, left: `${l}%` }} />
        )),
      )}
      {/* half of the W emblem, split down the middle */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${side === "l" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"}`}>
        <span className="block font-serif text-[min(34vw,320px)] leading-none font-black text-white/[0.035] select-none">W</span>
      </div>
      {/* inner edge */}
      <div className={`absolute inset-y-0 ${side === "l" ? "right-0" : "left-0"} w-[3px] bg-gradient-to-b from-transparent via-[#e8c58a]/40 to-transparent`} />
    </div>
  );
}

export function CaveLogin({ next, notice }: { next?: string; notice?: string | null }) {
  const [state, action, pending] = useActionState<CaveState, FormData>(caveAction, { step: "email" });
  const formRef = useRef<HTMLFormElement>(null);
  const step = state?.step ?? "email";
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#050505] text-[#f4efe3]">
      {/* ── Inside the cave ── */}
      <div className="cave-lights absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_42%,rgba(232,197,138,0.16),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_50%_0%,rgba(244,239,227,0.10),transparent_70%)]" />
        {/* rock walls */}
        <div className="absolute inset-y-0 left-0 w-[22vw] bg-[radial-gradient(80%_60%_at_0%_50%,#151412,transparent_75%)]" />
        <div className="absolute inset-y-0 right-0 w-[22vw] bg-[radial-gradient(80%_60%_at_100%_50%,#151412,transparent_75%)]" />
        {/* floor grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38vh] opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(232,197,138,0.12) 0 1px, transparent 1px 80px), repeating-linear-gradient(0deg, rgba(232,197,138,0.12) 0 1px, transparent 1px 40px)",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom",
          }}
        />
        {/* ceiling lamps */}
        {[25, 50, 75].map((l) => (
          <div key={l} className="absolute top-0 h-[2px] w-24 -translate-x-1/2 bg-[#f4efe3]/70 shadow-[0_0_40px_10px_rgba(244,239,227,0.25)]" style={{ left: `${l}%` }} />
        ))}
        {/* scan line */}
        <div className="cave-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-[#e8c58a]/[0.05] to-transparent" />
        {/* grain */}
        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ── Panel ── */}
      <div className="relative flex h-full flex-col">
        <header className="cave-rise flex items-center justify-between px-6 py-5 font-mono text-[10px] tracking-[0.3em] text-[#f4efe3]/50 uppercase sm:px-10">
          <Link href="/" className="flex items-center gap-2 hover:text-[#f4efe3]">
            <ArrowLeft className="size-3.5" /> Back to store
          </Link>
          <span className="hidden sm:block">Restricted area · Staff only</span>
        </header>

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="cave-rise w-full max-w-[460px]">
            <div className="mb-10 flex flex-col items-center text-center">
              <div className="grid size-20 place-items-center border border-[#e8c58a]/40 bg-black/40 shadow-[0_0_60px_rgba(232,197,138,0.15)]">
                <span className="font-serif text-5xl leading-none font-black">W</span>
              </div>
              <p className="mt-6 font-mono text-[10px] tracking-[0.4em] text-[#e8c58a] uppercase">
                {step === "email" ? "Identify yourself" : "Verification required"}
                <span className="cave-caret ml-1">_</span>
              </p>
              <h1 className="mt-3 font-display text-[clamp(40px,6vw,64px)] leading-none font-[900] uppercase">The Cave</h1>
            </div>

            {notice && <p className="mb-6 border border-[#e8c58a]/30 bg-[#e8c58a]/5 p-4 text-center text-[13px] text-[#f4efe3]/80">{notice}</p>}

            <form ref={formRef} action={action} className="space-y-5">
              {next && <input type="hidden" name="next" value={next} />}
              {step === "email" ? (
                <>
                  <input type="hidden" name="intent" value="send" />
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-[#f4efe3]/50 uppercase">Staff email</span>
                    <input
                      name="email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@wstablished.com"
                      className="w-full border border-[#e9e4d8]/25 bg-black/40 px-4 py-4 font-mono text-[15px] text-[#f4efe3] placeholder:text-[#f4efe3]/25 focus:border-[#e8c58a] focus:outline-none"
                    />
                  </label>
                  {state?.error && <p className="text-[13px] text-[#ff8a7a]" role="alert">{state.error}</p>}
                  <button
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-3 bg-[#f4efe3] py-4 text-[12px] font-bold tracking-[0.25em] text-black uppercase transition hover:bg-[#e8c58a] disabled:opacity-50"
                  >
                    {pending ? "Signalling…" : "Send access code"} <ArrowRight className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <input type="hidden" name="email" value={state && "email" in state ? state.email : ""} />
                  <input type="hidden" name="intent" value="verify" />
                  <p className="text-center text-[13px] text-[#f4efe3]/70">
                    {state && "info" in state && state.info ? state.info : `Code sent to ${state && "email" in state ? state.email : ""}.`}
                  </p>
                  <CodeBoxes key={state && "nonce" in state ? state.nonce : "fresh"} disabled={pending} onComplete={() => formRef.current?.requestSubmit()} />
                  {state?.error && <p className="text-center text-[13px] text-[#ff8a7a]" role="alert">{state.error}</p>}
                  <button
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-3 bg-[#f4efe3] py-4 text-[12px] font-bold tracking-[0.25em] text-black uppercase transition hover:bg-[#e8c58a] disabled:opacity-50"
                  >
                    <Lock className="size-4" /> {pending ? "Verifying…" : "Enter"}
                  </button>
                  <div className="flex justify-between font-mono text-[10px] tracking-[0.2em] text-[#f4efe3]/50 uppercase">
                    <button type="submit" name="intent" value="back" formNoValidate className="hover:text-[#f4efe3]">← Different email</button>
                    <button type="submit" name="intent" value="resend" formNoValidate className="hover:text-[#f4efe3]">Resend code</button>
                  </div>
                </>
              )}
            </form>

            <p className="mt-10 text-center font-mono text-[10px] tracking-[0.2em] text-[#f4efe3]/30 uppercase">Codes expire after 10 minutes · 5 tries</p>
          </div>
        </main>
      </div>

      {/* ── Blast doors (open on load) ── */}
      <div className="cave-doors pointer-events-none absolute inset-0">
        <Door side="l" />
        <Door side="r" />
        <div aria-hidden className="cave-seam absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#e8c58a] shadow-[0_0_30px_6px_rgba(232,197,138,0.5)]" />
      </div>
    </div>
  );
}
