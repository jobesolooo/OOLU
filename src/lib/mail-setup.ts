import "server-only";
import { Resend } from "resend";
import { getKey, saveKey } from "./keys";
import { getBusiness } from "./business";
import { siteUrl } from "./site-url";

/**
 * Connects the shop's email domain to Resend for sending AND receiving, and points
 * incoming mail at /api/webhooks/resend (which forwards it to the staff inbox).
 * Everything except the DNS records is done from Admin → Settings with one button.
 */

export const inboundUrl = () => `${siteUrl().replace(/\/$/, "")}/api/webhooks/resend`;

export type DnsRecord = { kind: string; type: string; name: string; value: string; priority?: number; status: string };
export type EmailSetupStatus =
  | { state: "no-key" }
  | { state: "error"; message: string }
  | {
      state: "ok";
      domain: string;
      found: boolean;
      status?: string;
      sending?: boolean;
      receiving?: boolean;
      records: DnsRecord[];
      webhook: boolean;
      webhookSecret: boolean;
    };

function explain(err: { name?: string; message?: string } | null | undefined) {
  const msg = err?.message ?? "Unknown error";
  if (err?.name === "restricted_api_key" || /restricted|only send emails/i.test(msg))
    return "Your Resend API key can only send. In Resend → API Keys, create a key with Full access and paste it under Account keys → Email.";
  if (err?.name === "invalid_api_key" || /api key is invalid/i.test(msg)) return "Resend says the API key isn't valid. Paste it again under Account keys → Email.";
  return `Resend: ${msg}`;
}

async function client() {
  const key = await getKey("RESEND_API_KEY");
  return key ? new Resend(key) : null;
}

export async function emailSetupStatus(): Promise<EmailSetupStatus> {
  const resend = await client();
  if (!resend) return { state: "no-key" };
  const { emailDomain } = await getBusiness();
  try {
    const [domains, hooks, secret] = await Promise.all([resend.domains.list(), resend.webhooks.list(), getKey("RESEND_WEBHOOK_SECRET")]);
    if (domains.error) return { state: "error", message: explain(domains.error) };
    const webhook = Boolean(hooks.data?.data.some((h) => h.endpoint === inboundUrl() && h.status === "enabled" && (h.events ?? []).includes("email.received")));
    const d = domains.data.data.find((x) => x.name === emailDomain);
    if (!d) return { state: "ok", domain: emailDomain, found: false, records: [], webhook, webhookSecret: Boolean(secret) };
    const full = await resend.domains.get(d.id);
    if (full.error) return { state: "error", message: explain(full.error) };
    return {
      state: "ok",
      domain: emailDomain,
      found: true,
      status: full.data.status,
      sending: full.data.capabilities.sending === "enabled",
      receiving: full.data.capabilities.receiving === "enabled",
      records: full.data.records.map((r) => ({
        kind: r.record,
        type: r.type,
        name: r.name,
        value: r.value,
        priority: "priority" in r ? r.priority : undefined,
        status: r.status,
      })),
      webhook,
      webhookSecret: Boolean(secret),
    };
  } catch (err) {
    return { state: "error", message: explain(err as Error) };
  }
}

/** Create/enable the domain (sending + receiving) and the incoming-mail webhook. Safe to press again. */
export async function setUpEmail(by: string): Promise<{ ok?: string; error?: string }> {
  const resend = await client();
  if (!resend) return { error: "Paste your Resend API key under Account keys → Email first." };
  const { emailDomain } = await getBusiness();
  if (!/^https:\/\//.test(inboundUrl())) return { error: "Incoming mail needs the live site (https). Run this from the live admin, not your computer." };

  // 1. Domain, with sending and receiving on.
  const list = await resend.domains.list();
  if (list.error) return { error: explain(list.error) };
  let domain = list.data.data.find((d) => d.name === emailDomain);
  if (!domain) {
    const created = await resend.domains.create({ name: emailDomain, region: "eu-west-1", capabilities: { sending: "enabled", receiving: "enabled" } });
    if (created.error) return { error: explain(created.error) };
    domain = { ...created.data, capabilities: created.data.capabilities };
  } else if (domain.capabilities.receiving !== "enabled" || domain.capabilities.sending !== "enabled") {
    const upd = await resend.domains.update({ id: domain.id, capabilities: { sending: "enabled", receiving: "enabled" } });
    if (upd.error) return { error: explain(upd.error) };
  }

  // 2. Webhook for incoming mail. Resend only shows the signing secret when it's created,
  //    so if we don't have it saved, replace the webhook with a fresh one.
  const hooks = await resend.webhooks.list();
  if (hooks.error) return { error: explain(hooks.error) };
  // Ours = any webhook pointing at /api/webhooks/resend, also on an old address (e.g. the vercel.app one before the domain moved).
  const mine = hooks.data.data.filter((h) => h.endpoint.endsWith("/api/webhooks/resend"));
  const haveSecret = Boolean(await getKey("RESEND_WEBHOOK_SECRET"));
  const good = mine.find((h) => h.endpoint === inboundUrl() && h.status === "enabled" && (h.events ?? []).includes("email.received"));
  if (!good || !haveSecret || mine.length > 1) {
    for (const h of mine) await resend.webhooks.remove(h.id);
    const hook = await resend.webhooks.create({ endpoint: inboundUrl(), events: ["email.received"] });
    if (hook.error) return { error: explain(hook.error) };
    await saveKey("RESEND_WEBHOOK_SECRET", hook.data.signing_secret, by);
  }

  // 3. Ask Resend to check the DNS records now (they may not be added yet; that's fine).
  await resend.domains.verify(domain.id).catch(() => {});
  return { ok: `${emailDomain} is connected to Resend. Add the DNS records below where the domain is registered; Resend checks them automatically.` };
}
