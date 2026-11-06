import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { adminIssueGiftCard, setGiftCardDisabled } from "../actions";
import { AdminForm } from "../FormMessage";

export default async function GiftCardsAdmin() {
  const db = await getDb();
  const cards = await db.select().from(schema.giftCards).where(sql`${schema.giftCards.status} <> 'pending'`).orderBy(desc(schema.giftCards.createdAt)).limit(200);
  const outstanding = cards.filter((c) => c.status === "active").reduce((s, c) => s + c.balance, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <div className="bg-white p-6">
          <p className="text-[10px] tracking-[0.14em] text-ash uppercase">Outstanding balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(outstanding)}</p>
          <p className="mt-1 text-xs text-ash">Value still redeemable across active cards.</p>
        </div>
        <div className="bg-white p-6">
          <h1 className="font-display text-2xl font-[900] uppercase">Issue a gift card</h1>
          <p className="mt-2 text-xs text-ash">For store credit, apologies or giveaways. No payment is taken.</p>
          <AdminForm action={adminIssueGiftCard} submitLabel="Issue card" className="mt-6 space-y-3">
            <input name="amount" required inputMode="decimal" placeholder="Amount in USD, e.g. 25" className="input" />
            <input name="email" type="email" placeholder="Email it to (optional)" className="input" />
            <input name="note" placeholder="Internal note (optional)" className="input" />
          </AdminForm>
        </div>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] tracking-[0.14em] text-ash uppercase">
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Balance</th>
              <th className="p-4 font-medium">Recipient</th>
              <th className="p-4 font-medium">Created</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {cards.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-ash">No gift cards yet.</td></tr>}
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
  );
}
