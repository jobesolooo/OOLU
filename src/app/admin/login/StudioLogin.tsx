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

/* ── Cave scenery ────────────────────────────────────────── */
// Fixed shapes (not random at render) so server and browser draw the same cave.
const STALACTITES = "M0,0 L0,20 Q17,90 23,164 Q39,90 56,16 L56,10 Q66,26 73,47 Q80,26 91,10 L91,22 Q110,11 119,21 Q135,11 155,29 L155,27 Q177,124 186,225 Q208,124 231,14 L231,12 Q243,54 254,99 Q260,54 272,21 L272,9 Q297,79 306,144 Q329,79 353,13 L353,18 Q379,55 397,100 Q412,55 438,15 L438,20 Q466,14 486,26 Q503,14 531,27 L531,17 Q558,124 569,226 Q593,124 620,25 L620,25 Q632,26 642,47 Q649,26 662,21 L662,21 Q692,95 714,172 Q732,95 762,18 L762,9 Q791,20 814,36 Q830,20 859,23 L859,16 Q884,29 896,52 Q916,29 941,23 L941,9 Q950,40 954,72 Q963,40 973,25 L973,10 Q985,63 996,114 Q1001,63 1013,18 L1013,14 Q1035,29 1055,52 Q1065,29 1087,17 L1087,12 Q1105,32 1112,58 Q1128,32 1146,13 L1146,8 Q1160,84 1168,152 Q1180,84 1194,17 L1194,19 Q1212,32 1226,58 Q1236,32 1254,22 L1254,27 Q1279,116 1301,211 Q1313,116 1338,26 L1338,9 Q1356,33 1370,60 Q1381,33 1399,9 L1399,8 Q1413,58 1419,105 Q1432,58 1446,11 L1440,0Z";
const STALACTITES_BACK = "M0,0 L0,5 Q10,44 14,89 Q18,44 28,5 L28,5 Q46,34 54,68 Q62,34 80,5 L80,5 Q91,50 95,99 Q100,50 111,5 L111,5 Q132,36 141,71 Q150,36 171,5 L171,5 Q187,22 194,44 Q201,22 216,5 L216,5 Q224,29 227,57 Q230,29 237,5 L237,5 Q254,13 261,27 Q269,13 286,5 L286,5 Q307,22 316,43 Q325,22 346,5 L346,5 Q357,12 361,24 Q366,12 377,5 L377,5 Q402,47 412,94 Q423,47 447,5 L447,5 Q469,41 479,82 Q489,41 511,5 L511,5 Q518,26 522,53 Q525,26 533,5 L533,5 Q548,16 555,32 Q562,16 577,5 L577,5 Q601,28 611,57 Q621,28 645,5 L645,5 Q655,51 659,102 Q663,51 673,5 L673,5 Q682,56 686,113 Q690,56 699,5 L699,5 Q714,38 720,75 Q727,38 742,5 L742,5 Q755,34 760,68 Q766,34 779,5 L779,5 Q789,12 793,24 Q798,12 808,5 L808,5 Q830,22 840,43 Q849,22 871,5 L871,5 Q892,20 901,41 Q910,20 930,5 L930,5 Q954,55 965,109 Q975,55 999,5 L999,5 Q1019,48 1028,96 Q1036,48 1057,5 L1057,5 Q1074,46 1081,93 Q1088,46 1106,5 L1106,5 Q1115,34 1119,68 Q1123,34 1132,5 L1132,5 Q1153,20 1162,40 Q1172,20 1193,5 L1193,5 Q1216,54 1226,109 Q1236,54 1259,5 L1259,5 Q1273,28 1280,57 Q1286,28 1300,5 L1300,5 Q1315,29 1321,59 Q1327,29 1342,5 L1342,5 Q1367,29 1377,59 Q1388,29 1412,5 L1412,5 Q1420,15 1423,29 Q1426,15 1433,5 L1433,5 Q1453,60 1461,119 Q1470,60 1489,5 L1440,0Z";
const WALL_L = "M0,0 L125,19 L179,48 L153,83 L150,123 L165,148 L205,178 L300,211 L300,239 L300,265 L300,297 L294,331 L250,368 L300,386 L278,415 L262,438 L300,466 L300,504 L263,535 L300,574 L268,606 L300,634 L255,674 L216,697 L300,731 L300,744 L300,781 L300,821 L267,834 L300,863 L300,884 L296,906 L300,936 L300,966 L300,990 L300,1000 L0,1000Z";
const WALL_R = "M0,0 L127,25 L127,50 L129,67 L84,101 L118,116 L171,129 L184,159 L237,172 L185,190 L223,215 L222,245 L198,269 L236,309 L206,330 L235,344 L223,380 L168,415 L164,453 L117,476 L149,510 L229,549 L181,564 L188,581 L213,598 L171,628 L146,646 L124,680 L112,698 L68,728 L42,746 L85,768 L56,796 L51,818 L59,844 L40,861 L40,896 L88,929 L130,967 L175,991 L198,1000 L0,1000Z";
/** Stalactite tips that drip: [left %, tip depth % of the stalactite band] */
const DRIPS: [number, number][] = [[1.61, 63.0], [12.89, 86.7], [21.23, 55.4], [39.5, 87.0], [49.56, 66.2], [81.09, 58.4], [90.32, 81.1]];

const ROCK_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .02' numOctaves='5' seed='4'/%3E%3CfeDiffuseLighting lighting-color='%23a592ff' surfaceScale='5'%3E%3CfeDistantLight azimuth='225' elevation='38'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23r)'/%3E%3C/svg%3E\")";

/** Noise stretched tall and thin = streaks of falling water (tinted pale lavender). */
const water = (fx: string, fy: string, seed: number, w: number, h: number, a: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Cfilter id='w' filterUnits='userSpaceOnUse' x='0' y='0' width='${w}' height='${h}'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${fx} ${fy}' numOctaves='3' seed='${seed}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.84 0 0 0 0 0.82 0 0 0 0 1 ${a} 0 0 0 -0.52'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)'/%3E%3C/svg%3E")`;
const WATER_FINE = water("0.1", "0.0041667", 2, 360, 720, "1.45");
const WATER_COARSE = water("0.0333333", "0.0020833", 9, 480, 960, "1.5");

function Cave() {
  return (
    <div aria-hidden className="studio-lights absolute inset-0">
      {/* depth: deep violet-black with a lit chamber in the middle */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,#1a1530_0%,#0b0912_55%,#050407_100%)]" />
      {/* rough stone texture, strongest at the edges */}
      <div
        className="absolute inset-0 opacity-[0.22] mix-blend-soft-light [mask-image:radial-gradient(60%_55%_at_50%_45%,transparent_30%,black_80%)]"
        style={{ backgroundImage: ROCK_TEXTURE, backgroundSize: "420px 420px" }}
      />
      {/* light shafts from cracks in the ceiling */}
      {[
        [30, -14, 0],
        [52, 8, 1.5],
        [68, -6, 3],
      ].map(([l, r, d]) => (
        <div
          key={l}
          className="studio-shaft absolute top-0 h-[85vh] w-[14vw] origin-top bg-[linear-gradient(to_bottom,rgba(214,204,255,0.16),rgba(165,146,255,0.05)_55%,transparent)] blur-[18px]"
          style={{ left: `${l}%`, rotate: `${r}deg`, animationDelay: `${d}s` }}
        />
      ))}
      {/* back stalactites (lighter, further away) */}
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[17vh] w-full opacity-70">
        <path d={STALACTITES_BACK} fill="#120f1c" />
      </svg>
      {/* rock walls */}
      <svg viewBox="0 0 320 1000" preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full w-[clamp(80px,19vw,300px)]">
        <defs>
          <linearGradient id="wall-rim-l" x1="0" x2="1">
            <stop offset="0" stopColor="#060509" />
            <stop offset="0.75" stopColor="#0f0c18" />
            <stop offset="1" stopColor="#221c38" />
          </linearGradient>
        </defs>
        <path d={WALL_L} fill="url(#wall-rim-l)" stroke="rgba(165,146,255,0.14)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg viewBox="0 0 320 1000" preserveAspectRatio="none" className="absolute inset-y-0 right-0 h-full w-[clamp(80px,19vw,300px)] -scale-x-100">
        <defs>
          <linearGradient id="wall-rim-r" x1="0" x2="1">
            <stop offset="0" stopColor="#060509" />
            <stop offset="0.75" stopColor="#0f0c18" />
            <stop offset="1" stopColor="#221c38" />
          </linearGradient>
        </defs>
        <path d={WALL_R} fill="url(#wall-rim-r)" stroke="rgba(165,146,255,0.14)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* stone texture over the walls */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay [mask-image:linear-gradient(90deg,black_0%,transparent_22%,transparent_78%,black_100%)]"
        style={{ backgroundImage: ROCK_TEXTURE, backgroundSize: "300px 300px" }}
      />
      {/* front stalactites with a faint lavender edge */}
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[24vh] w-full drop-shadow-[0_6px_14px_rgba(165,146,255,0.18)]">
        <path d={STALACTITES} fill="#08070c" stroke="rgba(165,146,255,0.18)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* drips falling from stalactite tips into the pool */}
      {DRIPS.map(([x, y], i) => (
        <span key={x} className="absolute" style={{ left: `${x}%`, top: `calc(24vh * ${y / 100})` }}>
          <span
            className="studio-drip block h-2.5 w-[3px] rounded-full bg-[#cfc6ff]/80"
            style={{ animationDelay: `${i * 1.37}s`, "--fall": `calc(82vh - 24vh * ${y / 100})` } as React.CSSProperties}
          />
        </span>
      ))}
      {/* drifting mist */}
      <div className="studio-mist absolute inset-x-[-20%] bottom-[14vh] h-[30vh] bg-[radial-gradient(50%_50%_at_30%_50%,rgba(200,190,255,0.10),transparent_70%),radial-gradient(40%_50%_at_75%_60%,rgba(200,190,255,0.08),transparent_70%)] blur-xl" />
      {/* the pool */}
      <div className="absolute inset-x-0 bottom-0 h-[18vh] overflow-hidden bg-[linear-gradient(to_bottom,#0d0b16,#040306)]">
        <div className="absolute inset-x-0 top-0 h-px bg-[#a592ff]/30" />
        {/* reflection of the chamber light */}
        <div className="studio-shimmer absolute top-0 left-[20vw] h-full w-[60vw] bg-[radial-gradient(50%_70%_at_50%_0%,rgba(165,146,255,0.28),transparent_70%)]" />
        {/* ripples on the surface */}
        <div
          className="studio-waves absolute inset-0 opacity-50"
          style={{ background: "repeating-linear-gradient(180deg, rgba(207,198,255,0.10) 0 1px, transparent 1px 9px)" }}
        />
        {DRIPS.map(([x], i) => (
          <span
            key={x}
            className="studio-ripple absolute top-[18%] h-3 w-16 rounded-[50%] border border-[#cfc6ff]/40"
            style={{ left: `${x}%`, animationDelay: `${i * 1.37}s` }}
          />
        ))}
      </div>
      {/* spray particles */}
      {[8, 19, 33, 47, 58, 71, 84, 93].map((x, i) => (
        <span
          key={x}
          className="studio-spray absolute bottom-[16vh] size-1 rounded-full bg-[#d9d2ff]/50"
          style={{ left: `${x}%`, animationDelay: `${(i * 0.9) % 6}s`, animationDuration: `${6 + (i % 3) * 2}s` }}
        />
      ))}
      {/* soft halo behind the sign-in so it stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(32%_40%_at_50%_52%,rgba(5,4,8,0.55),transparent_75%)]" />
      {/* grain */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </div>
  );
}

/* ── Waterfall entrance ──────────────────────────────────── */
/** Two halves of a falling-water curtain that part as you walk through. */
function Falls({ side }: { side: "l" | "r" }) {
  return (
    <div className={`studio-fall-${side} absolute inset-y-[-10%] ${side === "l" ? "left-[-6%]" : "right-[-6%]"} w-[56%] overflow-hidden`}>
      {/* three sheets of streaky water falling at different speeds */}
      <div className="studio-pour-a absolute inset-0" style={{ backgroundImage: WATER_FINE }} />
      <div className="studio-pour-b absolute inset-0" style={{ backgroundImage: WATER_COARSE }} />
      <div className="studio-pour-c absolute inset-0" style={{ backgroundImage: WATER_FINE }} />
      {/* darker at the top and bottom, lavender light glowing through the middle */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,5,12,0.7),rgba(6,5,12,0.25)_35%,rgba(40,30,90,0.15)_55%,rgba(6,5,12,0.55))]" />
      {/* the edge of the curtain is lighter where the water is thin */}
      <div className={`absolute inset-y-0 ${side === "l" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} w-16 from-[#d9d2ff]/25 to-transparent`} />
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
      <div aria-hidden className="studio-falls pointer-events-none absolute inset-0 overflow-hidden">
        {/* light glowing through the water from inside */}
        <div className="studio-beyond absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_50%,rgba(165,146,255,0.35),transparent_70%)]" />
        <Falls side="l" />
        <Falls side="r" />
        {/* churning mist where the water lands */}
        <div className="studio-foam absolute inset-x-0 bottom-[-6%] h-[34%] bg-[radial-gradient(60%_80%_at_50%_100%,rgba(235,232,255,0.55),rgba(200,190,255,0.12)_55%,transparent_75%)] blur-2xl" />
        {/* the light dims before you step through */}
        <div className="studio-dim absolute inset-0 bg-black" />
      </div>
    </div>
  );
}
