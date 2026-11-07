"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { studioAction, type StudioState } from "./actions";
import { StaffMark } from "@/components/auth/StaffMark";
import { WaterGL } from "./WaterGL";

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

  const update = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 6);
    setCode(v);
    onType(v.length === 0);
    if (v.length === 6) setTimeout(onComplete, 80);
  };
  const active = Math.min(code.length, 5);

  // Focus the passcode, and catch digits typed before it had focus (so the first one is never lost).
  const latest = useRef({ code, disabled, update });
  useEffect(() => {
    latest.current = { code, disabled, update };
  });
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const { code: c, disabled: off, update: up } = latest.current;
      if (off || e.metaKey || e.ctrlKey || e.altKey || !/^\d$/.test(e.key)) return;
      if (document.activeElement === ref.current) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      ref.current?.focus();
      up(c + e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

/* ── Cave scenery ────────────────────────────────────────── */
/**
 * Background: a real photo taken from inside a cave, behind a waterfall
 * (Muhammad Kamran Khan, Unsplash License), graded to night with OOLU lavender.
 * Kept alive with a slow drifting camera, GPU-drawn water over the falls,
 * mist, spray and soft light.
 */
function Cave() {
  return (
    <div aria-hidden className="studio-lights absolute inset-0 overflow-hidden bg-[#06050a]">
      {/* the photo, slowly drifting */}
      <div className="studio-drift absolute inset-[-6%]">
        <Image
          src="/images/studio/cave.jpg"
          alt=""
          fill
          priority
          sizes="112vw"
          className="object-cover object-[22%_40%] [filter:brightness(0.4)_saturate(0.3)_contrast(1.2)]"
        />
        {/* night grade: lavender in the light, near-black in the shadows */}
        <div className="absolute inset-0 bg-[#4b3a9e] mix-blend-color opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,5,10,0.55),rgba(6,5,10,0.05)_35%,rgba(6,5,10,0.35)_70%,rgba(6,5,10,0.9))]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,5,10,0.15)_0%,transparent_40%,rgba(6,5,10,0.55)_100%)]" />
      </div>
      {/* live water over the photo's waterfall */}
      <WaterGL
        mode="shimmer"
        scale={0.35}
        fps={30}
        className="absolute inset-y-0 left-[8%] h-full w-[52%] opacity-80 mix-blend-screen [mask-image:radial-gradient(60%_55%_at_50%_48%,black_35%,transparent_80%)] max-md:left-0 max-md:w-full"
      />
      {/* light pouring in from the cave mouth */}
      <div className="studio-shaft absolute top-[-10%] right-[2%] h-[90vh] w-[38vw] origin-top-right rotate-[18deg] bg-[linear-gradient(to_bottom,rgba(214,204,255,0.16),rgba(165,146,255,0.05)_55%,transparent)] blur-2xl" />
      {/* drifting mist */}
      <div className="studio-mist absolute inset-x-[-20%] bottom-[6vh] h-[34vh] bg-[radial-gradient(50%_50%_at_30%_50%,rgba(200,190,255,0.12),transparent_70%),radial-gradient(40%_50%_at_75%_60%,rgba(200,190,255,0.09),transparent_70%)] blur-xl" />
      {/* spray drifting up */}
      {[8, 19, 27, 36, 47, 58, 71, 84, 93].map((x, i) => (
        <span
          key={x}
          className="studio-spray absolute bottom-[10vh] size-1 rounded-full bg-[#d9d2ff]/60"
          style={{ left: `${x}%`, animationDelay: `${(i * 0.9) % 6}s`, animationDuration: `${6 + (i % 3) * 2}s` }}
        />
      ))}
      {/* vignette + a soft dark halo so the sign-in stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_40%,rgba(4,3,8,0.85)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(30%_38%_at_50%_52%,rgba(5,4,8,0.6),transparent_75%)]" />
      {/* grain */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
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
      {/* ── Inside the cave ── */}
      <Cave />

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

      {/* ── Waterfall entrance (plays once on load) ── */}
      <div aria-hidden className="studio-falls pointer-events-none absolute inset-0 overflow-hidden bg-[#05040a]">
        <WaterGL mode="curtain" partAt={1.5} partFor={1.15} stopAfter={3.2} scale={0.75} className="absolute inset-0 size-full" />
        {/* the light dims before you step through */}
        <div className="studio-dim absolute inset-0 bg-black" />
      </div>
    </div>
  );
}
