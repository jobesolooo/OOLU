import { and, desc, ilike, inArray, or, sql } from "drizzle-orm";
import { EmptyRow } from "../Empty";
import { Users } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminHeader, StatTile, table } from "../ui";
import { cx } from "@/lib/format";

const PAID = ["paid", "fulfilled", "shipped", "delivered", "partially_refunded"] as const;

export default async function CustomersAdmin({ searchParams }: PageProps<"/admin/customers">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const db = await getDb();
  const users = await db
    .select()
    .from(schema.users)
    .where(q ? or(ilike(schema.users.email, `%${q}%`), ilike(schema.users.name, `%${q}%`)) : undefined)
    .orderBy(desc(schema.users.createdAt))
    .limit(200);
  const ids = users.map((u) => u.id);
  const [stats, logins] = ids.length
    ? await Promise.all([
        db
          .select({
            userId: schema.orders.userId,
            orders: sql<number>`count(*)::int`,
            spent: sql<number>`coalesce(sum(${schema.orders.total} - ${schema.orders.refundedAmount}),0)::int`,
            last: sql<string>`max(${schema.orders.paidAt})`,
          })
          .from(schema.orders)
          .where(and(inArray(schema.orders.userId, ids), inArray(schema.orders.status, [...PAID])))
          .groupBy(schema.orders.userId),
        db.select().from(schema.oauthAccounts).where(inArray(schema.oauthAccounts.userId, ids)),
      ])
    : [[], []];
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  const methods = (id: string, hasPw: boolean) =>
    [hasPw && "Email", ...logins.filter((l) => l.userId === id).map((l) => (l.provider === "google" ? "Google" : "Apple"))].filter(Boolean).join(" · ");

  const [total] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users);
  const [verified] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(sql`${schema.users.emailVerifiedAt} is not null`);
  const [social] = await db.select({ n: sql<number>`count(distinct ${schema.oauthAccounts.userId})::int` }).from(schema.oauthAccounts);

  return (
    <>
      <AdminHeader eyebrow="People" title="Customers" />
      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Accounts" value={String(total.n)} />
        <StatTile index={1} label="Confirmed email" value={String(verified.n)} />
        <StatTile index={2} label="Google / Apple" value={String(social.n)} />
      </div>
      <form className="mt-10 mb-4 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or email" className="input py-2.5" />
        <button className="btn-solid shrink-0 py-2.5">Search</button>
      </form>
      <div className={table.wrap}>
        <table className={cx(table.table, "min-w-[760px]")}>
          <thead className={table.head}>
            <tr>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Sign-in</th>
              <th className="p-4 font-medium">Joined</th>
              <th className="p-4 text-right font-medium">Orders</th>
              <th className="p-4 text-right font-medium">Spent</th>
              <th className="p-4 font-medium">Last order</th>
            </tr>
          </thead>
          <tbody className={table.body}>
            {users.length === 0 && (
              <EmptyRow
                colSpan={6}
                icon={Users}
                title={q ? "No matches" : "No customers yet"}
                body={q ? `Nobody matches “${q}”. Try part of a name or email.` : "People who create an account — by email, Google or Apple — appear here."}
              />
            )}
            {users.map((u) => {
              const s = byUser.get(u.id);
              return (
                <tr key={u.id}>
                  <td className="p-4">
                    <p className="font-medium">{u.name ?? "—"}{u.role === "admin" && <span className="ml-2 bg-ink px-1.5 py-0.5 text-[9px] text-white uppercase">admin</span>}</p>
                    <p className="text-xs text-ash">{u.email}{!u.emailVerifiedAt && " · unconfirmed"}</p>
                  </td>
                  <td className="p-4 text-xs">{methods(u.id, Boolean(u.passwordHash)) || "—"}</td>
                  <td className="p-4 text-ash">{formatDate(u.createdAt)}</td>
                  <td className="p-4 text-right tabular-nums">{s?.orders ?? 0}</td>
                  <td className="p-4 text-right tabular-nums">{formatMoney(s?.spent ?? 0)}</td>
                  <td className="p-4 text-ash">{s?.last ? formatDate(s.last) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
