import Link from "next/link";
import { notFound } from "next/navigation";
import { getGiftCard, giftCardPaymentIntent } from "@/lib/giftcards";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { cx, formatDate, formatMoney } from "@/lib/format";
import { adjustGiftCard, removeGiftCard, resendGiftCardEmail, saveGiftCardDetails, setGiftCardDisabled } from "../../actions";
import { AdminForm } from "../../FormMessage";
import { AdminHeader, Panel, StatTile, ghostBtn } from "../../ui";

export default async function GiftCardDetail({ params }: PageProps<"/admin/gift-cards/[id]">) {
  const { id } = await params;
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getGiftCard(id) : null;
  if (!data) notFound();
  const { card, ledger } = data;
  const pi = isStripeConfigured() ? await giftCardPaymentIntent(card.stripeSessionId) : null;
  const usedOnOrders = ledger.some((l) => l.orderId);
  const spent = -ledger.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);

  return (
    <>
      <Link href="/admin/gift-cards" className="group mb-4 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-ash uppercase hover:text-ink">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Gift cards
      </Link>
      <AdminHeader
        eyebrow={card.stripeSessionId ? `Bought ${formatDate(card.createdAt)}${card.purchaserEmail ? ` by ${card.purchaserEmail}` : ""}` : `Issued ${formatDate(card.createdAt)}`}
        title={card.code}
        description={
          <span className={cx("rounded-full px-2.5 py-1 text-[11px]", card.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-ash")}>
            {card.status === "active" ? "Active" : card.status === "disabled" ? "Disabled" : "Waiting for payment"}
          </span>
        }
        actions={
          <>
            {pi && (
              <a href={stripeDashboardUrl(`/payments/${pi}`)} target="_blank" rel="noreferrer" className={ghostBtn}>
                Payment in Stripe ↗
              </a>
            )}
            {card.status !== "pending" && (
              <form action={setGiftCardDisabled}>
                <input type="hidden" name="id" value={card.id} />
                <input type="hidden" name="disabled" value={String(card.status !== "disabled")} />
                <button className={ghostBtn}>{card.status === "disabled" ? "Enable" : "Disable"}</button>
              </form>
            )}
            <form action={removeGiftCard}>
              <input type="hidden" name="id" value={card.id} />
              <button className={`${ghostBtn} border-rose-200 text-rose-700 hover:border-rose-600`} title={usedOnOrders ? "Used on orders, so it will be disabled instead" : undefined}>
                {usedOnOrders ? "Disable for good" : "Delete"}
              </button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Balance" value={formatMoney(card.balance, card.currency)} />
        <StatTile index={1} label="Original value" value={formatMoney(card.initialAmount, card.currency)} />
        <StatTile index={2} label="Spent / removed" value={formatMoney(spent, card.currency)} />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-3">
          <Panel title="Recipient & message">
            <AdminForm action={saveGiftCardDetails} submitLabel="Save details" className="space-y-3">
              <input type="hidden" name="id" value={card.id} />
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                <input name="recipientName" defaultValue={card.recipientName ?? ""} placeholder="Recipient name" className="input" />
                <input name="recipientEmail" type="email" defaultValue={card.recipientEmail ?? ""} placeholder="Recipient email" className="input" />
              </div>
              <input name="senderName" defaultValue={card.senderName ?? ""} placeholder="From (sender name)" className="input" />
              <textarea name="message" defaultValue={card.message ?? ""} rows={3} placeholder="Message" className="input" />
            </AdminForm>
            <div className="mt-5 border-t border-black/5 pt-5">
              <AdminForm action={resendGiftCardEmail} submitLabel="Send the gift card email again">
                <input type="hidden" name="id" value={card.id} />
                <p className="text-[12px] text-ash">Goes to {card.recipientEmail ?? card.purchaserEmail ?? "— (add an email above first)"}.</p>
              </AdminForm>
            </div>
          </Panel>

          <Panel title="History" flush>
            {ledger.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-ash">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {ledger.map((l) => (
                  <li key={l.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                    <span className={cx("w-24 shrink-0 font-semibold tabular-nums", l.amount >= 0 ? "text-emerald-700" : "text-ink")}>
                      {l.amount >= 0 ? "+" : "−"}
                      {formatMoney(Math.abs(l.amount), card.currency)}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px]">
                      {l.note ?? "—"}
                      {l.orderId && (
                        <Link href={`/admin/orders/${l.orderId}`} className="ml-2 text-[12px] underline">
                          View order
                        </Link>
                      )}
                    </span>
                    <span className="text-[12px] text-ash">{formatDate(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Change balance" className="h-fit lg:sticky lg:top-6">
          <AdminForm action={adjustGiftCard} submitLabel="Update balance" className="space-y-3">
            <input type="hidden" name="id" value={card.id} />
            <div className="grid grid-cols-2 gap-2">
              <select name="direction" className="input">
                <option value="add">Add €</option>
                <option value="remove">Remove €</option>
              </select>
              <input name="amount" required inputMode="decimal" placeholder="10" className="input" />
            </div>
            <input name="note" placeholder="Reason (shows in history)" className="input" />
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
