"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { studioAction, type StudioState } from "./actions";
import { StaffMark } from "@/components/auth/StaffMark";

/* ── Passcode boxes ──────────────────────────────────────── */
/**
 * Six single-digit boxes. Typing a digit jumps to the next box; Backspace goes back;
 * pasting or iOS/Android autofill of all six digits fills every box. When the 6th digit
 * is in, the form submits on its own.
 */
function CodeBoxes({ onComplete, onType, disabled }: { onComplete: () => void; onType: (empty: boolean) => void; disabled: boolean }) {
  // One real input (invisible, laid over the boxes) so phone keyboards never close between digits:
  // each digit simply lands in the next box. Also supports paste and SMS/password-manager autofill.
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const update = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 6);
    setCode(v);
    onType(v.length === 0);
    if (v.length === 6) setTimeout(onComplete, 80);
  };
  const active = Math.min(code.length, 5);

  return (
    <div className="relative">
      <input
        ref={ref}
        name="code"
        value={code}
        disabled={disabled}
        onChange={(e) => update(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label="6-digit passcode"
        // 16px keeps iPhones from zooming in; the text itself is invisible.
        className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none selection:bg-transparent"
      />
      <div aria-hidden className="flex justify-between gap-2 sm:gap-3">
        {Array.from({ length: 6 }, (_, i) => {
          const isActive = focused && !disabled && i === active && (code.length < 6 || i === 5);
          return (
            <div
              key={i}
              className={`relative grid h-16 w-full min-w-0 place-items-center border font-mono text-3xl text-[#f4efe3] transition sm:h-[72px] ${
                isActive
                  ? "border-[#a592ff] bg-black/60 shadow-[0_0_24px_rgba(165,146,255,0.25)]"
                  : code[i]
                    ? "border-[#e9e4d8]/40 bg-black/50"
                    : "border-[#e9e4d8]/25 bg-black/40"
              } ${disabled ? "opacity-50" : ""}`}
            >
              {code[i] ?? ""}
              {isActive && !code[i] && <span className="studio-caret absolute h-8 w-[2px] bg-[#a592ff]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Door half ───────────────────────────────────────────── */
function Door({ side }: { side: "l" | "r" }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-y-0 ${side === "l" ? "left-0 studio-door-l" : "right-0 studio-door-r"} w-1/2 overflow-hidden`}
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
      {/* half of the OOLU wordmark, split down the middle */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${side === "l" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"}`}>
        <span className="block font-wordmark text-[min(34vw,320px)] leading-none text-white/[0.04] whitespace-nowrap select-none">OOLU</span>
      </div>
      {/* inner edge */}
      <div className={`absolute inset-y-0 ${side === "l" ? "right-0" : "left-0"} w-[3px] bg-gradient-to-b from-transparent via-[#a592ff]/40 to-transparent`} />
    </div>
  );
}

export function StudioLogin({ next, notice }: { next?: string; notice?: string | null }) {
  const [state, action, pending] = useActionState<StudioState, FormData>(studioAction, { step: "username" });
  const formRef = useRef<HTMLFormElement>(null);
  const step = state?.step ?? "username";
  // Controlled so the username survives a failed attempt.
  const [username, setUsername] = useState("");
  // Hide the last error once they start typing a new code (reset by each new attempt via the box key).
  const [typedAfterError, setTypedAfterError] = useState<string | null>(null);
  const attempt = String(state && "nonce" in state ? state.nonce : "fresh");

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#050505] text-[#f4efe3]">
      {/* ── Inside the studio ── */}
      <div className="studio-lights absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_42%,rgba(165,146,255,0.16),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_50%_0%,rgba(244,239,227,0.10),transparent_70%)]" />
        {/* rock walls */}
        <div className="absolute inset-y-0 left-0 w-[22vw] bg-[radial-gradient(80%_60%_at_0%_50%,#151412,transparent_75%)]" />
        <div className="absolute inset-y-0 right-0 w-[22vw] bg-[radial-gradient(80%_60%_at_100%_50%,#151412,transparent_75%)]" />
        {/* floor grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38vh] opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(165,146,255,0.12) 0 1px, transparent 1px 80px), repeating-linear-gradient(0deg, rgba(165,146,255,0.12) 0 1px, transparent 1px 40px)",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom",
          }}
        />
        {/* ceiling lamps */}
        {[25, 50, 75].map((l) => (
          <div key={l} className="absolute top-0 h-[2px] w-24 -translate-x-1/2 bg-[#f4efe3]/70 shadow-[0_0_40px_10px_rgba(244,239,227,0.25)]" style={{ left: `${l}%` }} />
        ))}
        {/* scan line */}
        <div className="studio-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-[#a592ff]/[0.05] to-transparent" />
        {/* grain */}
        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ── Panel ── */}
      <div className="relative flex h-full flex-col">
        <header className="studio-rise flex items-center justify-between px-6 py-5 font-mono text-[10px] tracking-[0.3em] text-[#f4efe3]/50 uppercase sm:px-10">
          <Link href="/" className="flex items-center gap-2 hover:text-[#f4efe3]">
            <ArrowLeft className="size-3.5" /> Back to store
          </Link>
          <span className="hidden sm:block">Restricted area · Staff only</span>
        </header>

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="studio-rise w-full max-w-[460px]">
            <div className="mb-10 flex flex-col items-center text-center">
              <StaffMark className="w-[88px] drop-shadow-[0_0_32px_rgba(165,146,255,0.55)]" />
              <p className="mt-6 font-mono text-[10px] tracking-[0.4em] text-[#a592ff] uppercase">
                {step === "username" ? "Identify yourself" : "Enter passcode"}
                <span className="studio-caret ml-1">_</span>
              </p>
              <h1 className="mt-3 font-display font-normal tracking-[-0.02em] text-[clamp(40px,6vw,64px)] leading-none">The Studio</h1>
            </div>

            {notice && <p className="mb-6 border border-[#a592ff]/30 bg-[#a592ff]/5 p-4 text-center text-[13px] text-[#f4efe3]/80">{notice}</p>}

            <form ref={formRef} action={action} className="space-y-5">
              {next && <input type="hidden" name="next" value={next} />}
              {step === "username" ? (
                <>
                  <input type="hidden" name="intent" value="username" />
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] tracking-[0.3em] text-[#f4efe3]/50 uppercase">Username</span>
                    <input
                      name="username"
                      required
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-[#e9e4d8]/25 bg-black/40 px-4 py-4 font-mono text-[16px] text-[#f4efe3] placeholder:text-[#f4efe3]/25 focus:border-[#a592ff] focus:outline-none"
                    />
                  </label>
                  {state?.error && <p className="text-[13px] text-[#ff8a7a]" role="alert">{state.error}</p>}
                  <button
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-3 bg-[#f4efe3] py-4 text-[12px] font-bold tracking-[0.25em] text-black uppercase transition hover:bg-[#a592ff] disabled:opacity-50"
                  >
                    Continue <ArrowRight className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <input type="hidden" name="username" value={state && "username" in state ? state.username : username} />
                  <input type="hidden" name="intent" value="verify" />
                  <p className="text-center text-[13px] text-[#f4efe3]/70">
                    Welcome back, <span className="text-[#a592ff]">{state && "username" in state ? state.username : username}</span>. Enter your 6-digit passcode.
                  </p>
                  <CodeBoxes key={attempt} disabled={pending} onType={(empty) => setTypedAfterError(empty ? null : attempt)} onComplete={() => formRef.current?.requestSubmit()} />
                  {state?.error && typedAfterError !== attempt && <p className="text-center text-[13px] text-[#ff8a7a]" role="alert">{state.error}</p>}
                  <button
                    disabled={pending}
                    className="flex w-full items-center justify-center gap-3 bg-[#f4efe3] py-4 text-[12px] font-bold tracking-[0.25em] text-black uppercase transition hover:bg-[#a592ff] disabled:opacity-50"
                  >
                    <Lock className="size-4" /> {pending ? "Verifying…" : "Enter"}
                  </button>
                  <div className="flex justify-center font-mono text-[10px] tracking-[0.2em] text-[#f4efe3]/50 uppercase">
                    <button type="submit" name="intent" value="back" formNoValidate className="hover:text-[#f4efe3]">← Different username</button>
                  </div>
                </>
              )}
            </form>

            <p className="mt-10 text-center font-mono text-[10px] tracking-[0.2em] text-[#f4efe3]/30 uppercase">5 attempts per 15 minutes</p>
          </div>
        </main>
      </div>

      {/* ── Blast doors (open on load) ── */}
      <div className="studio-doors pointer-events-none absolute inset-0">
        <Door side="l" />
        <Door side="r" />
        <div aria-hidden className="studio-seam absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#a592ff] shadow-[0_0_30px_6px_rgba(165,146,255,0.5)]" />
      </div>
    </div>
  );
}
