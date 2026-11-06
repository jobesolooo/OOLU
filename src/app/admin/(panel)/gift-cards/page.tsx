import { desc, sql } from "drizzle-orm";
import { EmptyRow } from "../Empty";
import { Gift } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { adminIssueGiftCard, setGiftCardDisabled } from "../actions";
import { AdminForm } from "../FormMessage";
import { AdminHeader, StatTile, table } from "../ui";
import { cx } from "@/lib/format";

export default async function GiftCardsAdmin() {
  const db = await getDb();
  const cards = await db.select().from(schema.giftCards).where(sql`${schema.giftCards.status} <> 'pending'`).orderBy(desc(schema.giftCards.createdAt)).limit(200);
  const outstanding = cards.filter((c) => c.status === "active").reduce((s, c) => s + c.balance, 0);

  return (
    <>
    <AdminHeader eyebrow="Catalogue" title="Gift cards" description="Cards bought on the store and cards you issue yourself, with what's left on each." />
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-3">
        <StatTile dark label="Outstanding balance" value={formatMoney(outstanding)} sub="Still redeemable across active cards" />
        <div className="bg-white p-6 ring-1 ring-black/5">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Issue a gift card</h2>
          <p className="mt-2 text-xs text-ash">For store credit, apologies or giveaways. No payment is taken.</p>
          <AdminForm action={adminIssueGiftCard} submitLabel="Issue card" className="mt-6 space-y-3">
            <input name="amount" required inputMode="decimal" placeholder="Amount in EUR, e.g. 25" className="input" />
            <input name="email" type="email" placeholder="Email it to (optional)" className="input" />
            <input name="note" placeholder="Internal note (optional)" className="input" />
          </AdminForm>
        </div>
      </div>
      <div className={table.wrap}>
        <table className={cx(table.table, "min-w-[640px]")}>
          <thead className={table.head}>
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Balance</th>
              <th className="p-4 font-medium">Recipient</th>
              <th className="p-4 font-medium">Created</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className={table.body}>
            {cards.length === 0 && (
              <EmptyRow
                colSpan={5}
                icon={Gift}
                title="No gift cards yet"
                body="Cards bought at /gift-cards and cards you issue here show up with their remaining balance."
                action={{ label: "Open gift card page", href: "/gift-cards" }}
              />
            )}
            {cards.map((c) => (
              <tr key={c.id} className={c.status === "disabled" ? "text-ash" : ""}>
                <td className="p-4 font-mono text-xs">{c.code}</td>
                <td className="p-4 tabular-nums">{formatMoney(c.balance, c.currency)} <span className="text-ash">/ {formatMoney(c.initialAmount, c.currency)}</span></td>
                <td className="p-4">{c.recipientEmail ?? c.purchaserEmail ?? "—"}</td>
                <td className="p-4 text-ash">{formatDate(c.createdAt)}</td>
                <td className="p-4 text-right">
                  <form action={setGiftCardDisabled}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="disabled" value={String(c.status !== "disabled")} />
                    <button className="text-xs underline">{c.status === "disabled" ? "Enable" : "Disable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
