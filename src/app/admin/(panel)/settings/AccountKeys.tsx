"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import type { KeyDef, KeyGroup } from "@/lib/keys-catalog";
import type { KeySource, KeyState } from "@/lib/keys";
import { cx } from "@/lib/format";
import { ghostBtn } from "../ui";
import { changeKeys, lockKeys, unlockKeys, type KeysResult } from "./keys-actions";

const SOURCE: Record<KeySource, { label: string; tone: string }> = {
  panel: { label: "Saved here", tone: "bg-emerald-50 text-emerald-800 ring-emerald-600/20" },
  host: { label: "From Vercel", tone: "bg-sky-50 text-sky-800 ring-sky-600/20" },
  off: { label: "Turned off", tone: "bg-amber-50 text-amber-800 ring-amber-600/25" },
  unset: { label: "Not set", tone: "bg-black/[0.03] text-black/50 ring-black/10" },
  unreadable: { label: "Can't be read", tone: "bg-red-50 text-red-800 ring-red-600/20" },
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }) : null;

function Message({ state }: { state: KeysResult }) {
  if (!state) return null;
  return (
    <span role="status" className="flex flex-col text-xs">
      {state.error ? <span className="text-red-700">{state.error}</span> : <span className="text-emerald-700">{state.ok}</span>}
      {state.warn && <span className="text-amber-700">{state.warn}</span>}
    </span>
  );
}

/* ── Security lock (top of the Settings page) ────────────── */
/**
 * One passcode gate for everything sensitive on this page: account keys and email setup.
 * Sticks to the top while scrolling so it's always clear whether editing is open.
 */
export function SecurityLock({ unlockedUntil }: { unlockedUntil: number | null }) {
  const [state, run, pending] = useActionState(unlockKeys, undefined);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = unlockedUntil ? Math.max(0, unlockedUntil - now) : 0;

  if (left > 0) {
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return (
      <div id="security" className="flex items-center justify-between gap-3 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-900 shadow-sm ring-1 ring-emerald-600/15 sm:px-5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2">
          <LockOpen className="size-4 shrink-0" /> <strong className="font-semibold">Unlocked</strong>
          <span className="hidden sm:inline">· keys and email setup can be changed</span>· locks in{" "}
          <span className="tabular-nums">
            {m}:{String(s).padStart(2, "0")}
          </span>
        </span>
        <form action={lockKeys} className="shrink-0">
          <button className={ghostBtn}>
            <Lock className="size-3.5" /> Lock now
          </button>
        </form>
      </div>
    );
  }

  return (
    <form id="security" action={run} className="flex flex-col gap-3 bg-ink px-4 py-3 text-white shadow-lg sm:flex-row sm:items-end sm:px-5 sm:py-4">
      <div className="min-w-0 sm:flex-1">
        <p className="flex items-center gap-2 text-[13px] font-medium">
          <Lock className="size-4" /> Security lock
          <span className="font-normal text-white/60 sm:hidden">· passcode needed for keys &amp; email setup</span>
        </p>
        <p className="mt-1 hidden text-[12px] text-white/60 sm:block">
          Account keys and email setup control where payments and customer mail go. Enter the staff passcode to unlock them for 10 minutes. Business details and homepage
          settings can be edited without it.
        </p>
      </div>
      <div className="flex gap-2">
      <input
        name="code"
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        aria-label="Staff passcode"
        placeholder="••••••"
        className="min-w-0 flex-1 border border-white/25 bg-white/5 px-4 py-3 sm:w-[150px] sm:flex-none text-center font-mono text-[18px] tracking-[0.4em] text-white placeholder:text-white/30 focus:border-white focus:outline-none"
      />
      <button disabled={pending} className="bg-white px-5 py-3.5 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase disabled:opacity-50">
        {pending ? "Checking…" : "Unlock"}
      </button>
      </div>
      {state?.error && <p className="w-full text-xs text-red-300" role="alert">{state.error}</p>}
    </form>
  );
}

/* ── One field ───────────────────────────────────────────── */
function KeyField({ def, st, locked, pending, host }: { def: KeyDef; st: KeyState; locked: boolean; pending: boolean; host: string }) {
  const [show, setShow] = useState(false);
  const has = st.source === "panel" || st.source === "host";
  const src = st.source === "host" ? { ...SOURCE.host, label: `From ${host}` } : SOURCE[st.source];
  const btn = "text-[10px] font-semibold tracking-[0.14em] uppercase underline-offset-4 hover:underline disabled:opacity-40";
  const common = {
    name: def.name,
    disabled: locked || pending,
    placeholder: has ? `Paste a new ${def.label.toLowerCase()} to replace it` : def.placeholder,
    autoComplete: "off",
    spellCheck: false,
    "data-1p-ignore": true,
    "data-lpignore": "true",
  } as const;

  return (
    <div className="border-t border-black/5 pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[13px] font-medium">{def.label}</span>
        <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", src.tone)}>{src.label}</span>
        <code className="text-[10px] text-black/35">{def.name}</code>
        <span className="ml-auto flex gap-4">
          {(st.source === "panel" || st.source === "unreadable") && (
            <button name="intent" value={`clear:${def.name}`} disabled={locked || pending} className={cx(btn, "text-red-700")}>
              {st.hostHasValue ? `Remove (use ${host})` : "Remove"}
            </button>
          )}
          {(st.source === "host" || (st.source === "panel" && st.hostHasValue)) && (
            <button name="intent" value={`off:${def.name}`} disabled={locked || pending} className={cx(btn, "text-amber-700")}>
              Turn off
            </button>
          )}
          {st.source === "off" && (
            <button name="intent" value={`on:${def.name}`} disabled={locked || pending} className={cx(btn, "text-emerald-700")}>
              Turn back on
            </button>
          )}
        </span>
      </div>

      {st.display && (
        <p className="mb-2 font-mono text-[12px] break-all text-black/70">
          {st.display}
          {st.updatedAt && st.source === "panel" && (
            <span className="ml-2 font-sans text-[11px] text-ash">
              · {when(st.updatedAt)}
              {st.updatedBy ? ` by ${st.updatedBy}` : ""}
            </span>
          )}
        </p>
      )}
      {st.source === "off" && <p className="mb-2 text-[12px] text-amber-800">Switched off here, even though {host} still has a value.</p>}
      {st.source === "unreadable" && (
        <p className="mb-2 text-[12px] text-red-800">This was saved with a different SESSION_SECRET and can&apos;t be decrypted. Paste it again.</p>
      )}

      <div className="relative">
        {def.multiline ? (
          <textarea {...common} rows={4} className={cx("input font-mono text-[13px]", def.secret && !show && "[-webkit-text-security:disc]")} />
        ) : (
          <input {...common} type={def.secret && !show ? "password" : "text"} className="input pr-12 font-mono text-[14px]" />
        )}
        {def.secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide what you typed" : "Show what you typed"}
            className="absolute top-3 right-3 p-1.5 text-black/40 hover:text-ink"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── One section (Stripe, Email, …) ──────────────────────── */
function Group({ group, states, locked, host }: { group: KeyGroup; states: Record<string, KeyState>; locked: boolean; host: string }) {
  const [state, run, pending] = useActionState(changeKeys, undefined);
  const connected = group.keys.every((k) => states[k.name].source === "panel" || states[k.name].source === "host");
  const some = group.keys.some((k) => states[k.name].source === "panel" || states[k.name].source === "host");

  return (
    // key: after a successful change the form remounts, so typed secrets don't linger in the page.
    <form key={state?.ok ? state.at : "f"} action={run} id={`keys-${group.id}`} className="scroll-mt-6 bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <input type="hidden" name="group" value={group.id} />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
            <span className={cx("size-2 rounded-full", connected ? "bg-emerald-500" : some ? "bg-amber-500" : "bg-black/15")} />
            {group.title}
          </h3>
          <p className="mt-1 text-[12px] text-ash">{group.blurb}</p>
        </div>
        {group.link && (
          <a href={group.link.href} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-black/60 hover:text-ink">
            {group.link.label} <ArrowUpRight className="size-3" />
          </a>
        )}
      </div>
      <div className="space-y-4">
        {group.keys.map((def) => (
          <KeyField key={def.name} def={def} st={states[def.name]} locked={locked} pending={pending} host={host} />
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button name="intent" value="save" disabled={locked || pending} className="btn-solid !px-5 !py-3">
          {pending ? "Saving…" : "Save"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function AccountKeys({ groups, states, unlockedUntil, host }: { groups: KeyGroup[]; states: KeyState[]; unlockedUntil: number | null; host: string }) {
  const router = useRouter();
  const byName = Object.fromEntries(states.map((s) => [s.name, s]));
  const [now, setNow] = useState(() => Date.now());
  const locked = !unlockedUntil || unlockedUntil <= now;

  // Lock the forms the moment the timer runs out, and pick up changes made by another admin.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    const refresh = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return (
    <section id="keys" className="scroll-mt-6 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="max-w-2xl text-[12px] text-ash">
            Add, replace or remove the keys for Stripe, email and sign-in. Changes are live on the store within seconds, with no redeploy. Keys are encrypted
            before they&apos;re stored, and secrets are never shown again in full. A key saved here takes priority over the same one in {host}.
          </p>
        </div>
      </div>
      {locked && (
        <p className="flex items-center gap-2 bg-black/[0.03] px-4 py-3 text-[12px] text-black/70 ring-1 ring-black/5">
          <Lock className="size-3.5" /> Locked.{" "}
          <a href="#security" className="underline">
            Enter the staff passcode at the top of the page
          </a>{" "}
          to add, replace or remove keys.
        </p>
      )}
      {groups.map((g) => (
        <Group key={g.id} group={g} states={byName} locked={locked} host={host} />
      ))}
    </section>
  );
}
