import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getKey, keyStates } from "@/lib/keys";
import { getProducts } from "@/lib/catalog";
import { getSettings, holidayActive } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import { nowMs } from "@/lib/time";
import { cx } from "@/lib/format";

/** Settings → Developer (developer mode only): what's running and whether it's healthy. Never shows key values. */
export async function DeveloperPanel() {
  const t0 = nowMs();
  let db: { ok: boolean; ms: number; error?: string; users?: number; orders?: number; events24h?: number } = { ok: false, ms: 0 };
  try {
    const d = await getDb();
    const n = sql<number>`count(*)::int`;
    const [[u], [o], [e]] = await Promise.all([
      d.select({ n }).from(schema.users),
      d.select({ n }).from(schema.orders),
      d.select({ n }).from(schema.events).where(sql`${schema.events.at} > now() - interval '24 hours'`),
    ]);
    db = { ok: true, ms: nowMs() - t0, users: u.n, orders: o.n, events24h: e.n };
  } catch (err) {
    db = { ok: false, ms: nowMs() - t0, error: err instanceof Error ? err.message.slice(0, 160) : "Unknown error" };
  }
  const [keys, stripeKey, products, settings] = await Promise.all([keyStates(), getKey("STRIPE_SECRET_KEY"), getProducts(), getSettings()]);
  const stripeMode = !stripeKey ? "not connected" : stripeKey.startsWith("sk_live") || stripeKey.startsWith("rk_live") ? "live" : "test";
  const env = (name: string) => Boolean(process.env[name]);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;

  const rows: [string, React.ReactNode, boolean?][] = [
    ["Site", siteUrl(), true],
    ["Environment", `${process.env.VERCEL_ENV ?? process.env.NODE_ENV}${process.env.VERCEL_REGION ? ` · ${process.env.VERCEL_REGION}` : ""}`, true],
    ["Build", commit ? <a href={`https://github.com/jobesolooo/OOLU/commit/${commit}`} className="underline">{commit.slice(0, 7)}</a> : "local", true],
    ["Runtime", `Node ${process.version}`, true],
    ["Database", db.ok ? `${process.env.DATABASE_URL || process.env.POSTGRES_URL ? "Postgres" : "embedded (local)"} · ${db.ms} ms` : `error: ${db.error}`, db.ok],
    ["Accounts · orders", db.ok ? `${db.users} · ${db.orders}` : "–", db.ok],
    ["Visits logged (24 h)", db.ok ? String(db.events24h) : "–", db.ok],
    ["Stripe", stripeMode, stripeMode === "live"],
    ["Catalogue", `${products.length} products${stripeKey ? "" : " (demo)"}`, Boolean(stripeKey)],
    ["Christmas theme", holidayActive(settings, nowMs()) ? "on" : "off", true],
  ];
  const envNames = ["SESSION_SECRET", "DATABASE_URL", "KEYS_ENCRYPTION_KEY", "ADMIN_PASSCODE_HASH", "DEV_USERNAME", "DEV_MASTER_HASH", "NEXT_PUBLIC_SITE_URL"];

  return (
    <div className="space-y-3">
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-4 text-[11px] font-semibold tracking-[0.14em] uppercase">System</h3>
        <dl className="divide-y divide-black/5 text-[13px]">
          {rows.map(([k, v, ok]) => (
            <div key={k} className="grid grid-cols-[170px_minmax(0,1fr)] gap-3 py-2">
              <dt className="text-ash">{k}</dt>
              <dd className={cx("font-mono break-all", ok === false && "text-amber-700")}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Account keys</h3>
        <p className="mb-4 text-[12px] text-ash">Where each key comes from. Values are never shown here.</p>
        <ul className="grid gap-x-6 gap-y-1.5 font-mono text-[12px] sm:grid-cols-2">
          {keys.map((k) => (
            <li key={k.name} className="flex justify-between gap-3">
              <span className="truncate">{k.name}</span>
              <span className={cx(k.source === "panel" || k.source === "host" ? "text-emerald-700" : "text-ash")}>{k.source === "panel" ? "admin" : k.source}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Hosting environment</h3>
        <p className="mb-4 text-[12px] text-ash">Set in Vercel → Settings → Environment Variables. Shows only whether each is present.</p>
        <ul className="grid gap-x-6 gap-y-1.5 font-mono text-[12px] sm:grid-cols-2">
          {envNames.map((n) => (
            <li key={n} className="flex justify-between gap-3">
              <span className="truncate">{n}</span>
              <span className={env(n) ? "text-emerald-700" : "text-ash"}>{env(n) ? "set" : "missing"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
