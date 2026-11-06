import { desc, isNull } from "drizzle-orm";
import { EmptyRow } from "../Empty";
import { Mail } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { AdminHeader, StatTile, table } from "../ui";
import { cx } from "@/lib/format";

export default async function SubscribersAdmin() {
  const db = await getDb();
  const rows = await db.select().from(schema.subscribers).where(isNull(schema.subscribers.unsubscribedAt)).orderBy(desc(schema.subscribers.createdAt)).limit(500);
  const alerts = await db.select().from(schema.stockAlerts).where(isNull(schema.stockAlerts.notifiedAt));
  return (
    <>
      <AdminHeader eyebrow="People" title="Subscribers" actions={<a href="/admin/subscribers/export" className="btn-solid">Export CSV</a>} />
      <div className="mb-10 grid grid-cols-2 gap-3 lg:max-w-2xl">
        <StatTile dark index={0} label="Subscribed" value={String(rows.length)} />
        <StatTile index={1} label="Waiting on alerts" value={String(alerts.length)} sub="Restock and drop alerts" />
      </div>
      <div className={table.wrap}>
        <table className={cx(table.table, "min-w-[560px]")}>
          <thead className={table.head}>
            <tr><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Source</th><th className="p-4 font-medium">Welcome code</th><th className="p-4 font-medium">Joined</th></tr>
          </thead>
          <tbody className={table.body}>
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
