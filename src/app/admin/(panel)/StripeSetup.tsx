import { CheckCircle2, Circle } from "lucide-react";
import { getKeys } from "@/lib/keys";
import { cx } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";

export const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
  "price.deleted",
];

/** Connection status + the exact steps to connect Stripe. */
export async function StripeSetup({ compact = false }: { compact?: boolean }) {
  const k = await getKeys("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
  const key = k.STRIPE_SECRET_KEY ?? "";
  const connected = Boolean(key);
  const live = key.startsWith("sk_live") || key.startsWith("rk_live");
  const hook = Boolean(k.STRIPE_WEBHOOK_SECRET);
  const site = siteUrl();
  const steps = [
    {
      done: connected,
      title: "Add your Stripe secret key",
      body: (
        <>
          In Stripe go to <strong>Developers → API keys</strong> (start in test mode) and paste the secret key under{" "}
          <a href="/admin/settings#keys-stripe" className="underline">Settings → Account keys → Stripe</a>. It works straight away, no redeploy needed.
          {connected && <span className="mt-1 block text-emerald-700">Connected · {live ? "live mode" : "test mode"}</span>}
        </>
      ),
    },
    {
      done: hook,
      title: "Add the webhook (keeps Stripe → store in sync)",
      body: (
        <>
          <strong>Developers → Webhooks → Add endpoint</strong>: <code className="break-all">{site}/api/webhooks/stripe</code>, choose the events below, then paste
          the signing secret under <a href="/admin/settings#keys-stripe" className="underline">Account keys → Stripe</a>. Testing on your computer? Run{" "}
          <code className="break-all">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code> and use the secret it prints.
          {!compact && <span className="mt-2 block font-mono text-[11px] leading-relaxed text-ash">{WEBHOOK_EVENTS.join(" · ")}</span>}
        </>
      ),
    },
    {
      done: false,
      title: "Move your products into Stripe",
      body: <>Open Products and press <strong>Copy catalogue to Stripe</strong>. Photos, prices, sizes and colours are copied in one go. From then on you can edit in either place.</>,
    },
  ];
  return (
    <section className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <h2 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Stripe connection</h2>
      <p className="mb-5 text-[12px] text-ash">Products, discount codes and payments all live in Stripe. Changes here update Stripe, and changes in Stripe show up here.</p>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            {s.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" strokeWidth={1.75} /> : <Circle className="mt-0.5 size-5 shrink-0 text-black/25" strokeWidth={1.75} />}
            <div className="min-w-0 text-[13px] leading-relaxed">
              <p className={cx("font-medium", s.done && "text-ash line-through decoration-black/20")}>
                {i + 1}. {s.title}
              </p>
              <div className="mt-0.5 text-black/70">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
