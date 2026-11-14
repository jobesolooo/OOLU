import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { KEY_DEFS } from "./keys-catalog";

/**
 * Account keys managed from Admin → Settings.
 *
 * - Values saved in the panel are encrypted (AES-256-GCM) before they reach the database.
 *   The encryption key comes from KEYS_ENCRYPTION_KEY, or is derived from SESSION_SECRET.
 * - A value saved in the panel wins over the same variable on the host (Vercel).
 *   "Turned off" stores an empty override, so a host value can be switched off without a redeploy.
 * - Every server re-reads the list at most every few seconds, so a change is live almost at once
 *   everywhere, and immediately on the server that saved it.
 */

const ROW = "integration-keys";
const TTL_MS = 5_000;

type Stored = { v: string | null; at: string; by?: string };
type Row = Record<string, Stored>;

const g = globalThis as unknown as { __oolu_keys?: { at: number; row: Row } };

function cipherKey() {
  const base = process.env.KEYS_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!base) throw new Error("Set SESSION_SECRET (or KEYS_ENCRYPTION_KEY) before saving keys in the panel.");
  return Buffer.from(hkdfSync("sha256", base, "oolu-keys", "integration-keys:v1", 32));
}

function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${body.toString("base64")}`;
}

function decrypt(sealed: string): string | undefined {
  try {
    const [ver, iv, tag, body] = sealed.split(":");
    if (ver !== "v1") return undefined;
    const d = createDecipheriv("aes-256-gcm", cipherKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
  } catch {
    return undefined; // wrong encryption key (SESSION_SECRET changed) or damaged value
  }
}

async function readRow(fresh = false): Promise<Row> {
  const hit = g.__oolu_keys;
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.row;
  try {
    const db = await getDb();
    const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, ROW)).limit(1);
    const row = (r?.value ?? {}) as Row;
    g.__oolu_keys = { at: Date.now(), row };
    return row;
  } catch (err) {
    // No database yet (first deploy) → fall back to the host's variables.
    console.error("[keys] couldn't read saved keys, using host values", err);
    return hit?.row ?? {};
  }
}

async function writeRow(row: Row) {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: ROW, value: row })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: row, updatedAt: new Date() } });
  g.__oolu_keys = { at: Date.now(), row };
}

const fromHost = (name: string) => process.env[name]?.trim() || undefined;

/** The value in use right now: saved in the panel, else the host's, else undefined. */
export async function getKey(name: string): Promise<string | undefined> {
  const saved = (await readRow())[name];
  if (saved) return saved.v === null ? undefined : decrypt(saved.v) || undefined;
  return fromHost(name);
}

/** Several at once (one read). */
export async function getKeys<N extends string>(...names: N[]): Promise<Record<N, string | undefined>> {
  await readRow();
  const out = {} as Record<N, string | undefined>;
  for (const n of names) out[n] = await getKey(n);
  return out;
}

export type KeySource = "panel" | "host" | "off" | "unset" | "unreadable";
export type KeyState = {
  name: string;
  source: KeySource;
  /** Full value for non-secrets; a short hint like "sk_live_…4f2A" for secrets. */
  display: string | null;
  hostHasValue: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export function hint(value: string, secret: boolean) {
  if (!secret) return value;
  if (value.includes("PRIVATE KEY")) return "Private key ·····" + value.replace(/-----.*?-----|\s/g, "").slice(-4);
  const prefix = value.match(/^[a-z]{2,6}_(test_|live_)?/i)?.[0] ?? "";
  return `${prefix}····${value.slice(-4)}`;
}

/** Status of every managed key, for the settings screen. Never returns a secret in full. */
export async function keyStates(): Promise<KeyState[]> {
  const row = await readRow(true);
  return Object.values(KEY_DEFS).map((def) => {
    const saved = row[def.name];
    const host = fromHost(def.name);
    const base = { name: def.name, hostHasValue: Boolean(host), updatedAt: saved?.at ?? null, updatedBy: saved?.by ?? null };
    if (saved?.v === null) return { ...base, source: "off", display: null };
    if (saved) {
      const v = decrypt(saved.v);
      return v ? { ...base, source: "panel", display: hint(v, def.secret) } : { ...base, source: "unreadable", display: null };
    }
    if (host) return { ...base, source: "host", display: hint(host, def.secret) };
    return { ...base, source: "unset", display: null };
  });
}

export async function saveKey(name: string, value: string, by: string) {
  if (!KEY_DEFS[name]) throw new Error(`Unknown key ${name}`);
  const row = await readRow(true);
  await writeRow({ ...row, [name]: { v: encrypt(value), at: new Date().toISOString(), by } });
}

/** Remove the panel's value; the host's value (if any) takes over again. */
export async function clearKey(name: string) {
  const row = { ...(await readRow(true)) };
  delete row[name];
  await writeRow(row);
}

/** Switch a key off even if the host has one (stored as an empty override). */
export async function turnOffKey(name: string, by: string) {
  const row = await readRow(true);
  await writeRow({ ...row, [name]: { v: null, at: new Date().toISOString(), by } });
}
