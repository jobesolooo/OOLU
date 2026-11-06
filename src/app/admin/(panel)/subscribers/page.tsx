import { desc, isNull } from "drizzle-orm";
import { EmptyRow } from "../Empty";
import { Mail } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function SubscribersAdmin() {
  const db = await getDb();
  const rows = await db.select().from(schema.subscribers).where(isNull(schema.subscribers.unsubscribedAt)).orderBy(desc(schema.subscribers.createdAt)).limit(500);
  const alerts = await db.select().from(schema.stockAlerts).where(isNull(schema.stockAlerts.notifiedAt));
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-[900] uppercase">Subscribers</h1>
          <p className="mt-1 text-xs text-ash">
            {rows.length} subscribed · {alerts.length} people waiting on restock / drop alerts
          </p>
        </div>
        <a href="/admin/subscribers/export" className="btn-solid">Export CSV</a>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] tracking-[0.14em] text-ash uppercase">
            <tr><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Source</th><th className="p-4 font-medium">Welcome code</th><th className="p-4 font-medium">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.length === 0 && (
              <EmptyRow
                colSpan={4}
                icon={Mail}
                title="No subscribers yet"
                body="Sign-ups from the popup, footer, homepage and account settings land here, each with their welcome code."
                action={{ label: "Popup settings", href: "/admin/settings" }}
              />
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="p-4">{s.email}</td>
                <td className="p-4 text-ash">{s.source ?? "—"}</td>
                <td className="p-4 font-mono text-xs">{s.promoCode ?? "—"}</td>
                <td className="p-4 text-ash">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
