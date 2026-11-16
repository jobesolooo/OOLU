import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { accountCounts, isProtectedStaff, listAccounts, listGuests } from "@/lib/admin-users";
import { cx, formatDate, formatMoney } from "@/lib/format";
import { EmptyRow } from "../Empty";
import { AdminHeader, Segmented, StatTile, table } from "../ui";
import { RowLink } from "../RowLink";
import { ONLINE_MS } from "@/lib/analytics";
import { nowMs } from "@/lib/time";

const activeLabel = (d: Date | null, now: number) => {
  if (!d) return null;
  const m = Math.round((now - new Date(d).getTime()) / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  if (m < 24 * 60) return `${Math.floor(m / 60)} h ago`;
  return null;
};

const VIEWS = ["accounts", "guests", "staff"] as const;
type View = (typeof VIEWS)[number];

export default async function CustomersAdmin({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const view: View = VIEWS.find((v) => v === sp.view) ?? "accounts";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = sp.sort === "active" ? "active" : "new";
  const now = nowMs();
  const [counts, accounts, guests] = await Promise.all([
    accountCounts(),
    view === "guests" ? Promise.resolve([]) : listAccounts(view === "staff" ? "staff" : "accounts", q, sort),
    view === "guests" ? listGuests(q) : Promise.resolve([]),
  ]);
  const href = (v: View, s = sort) => `/admin/customers?view=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}${s === "active" ? "&sort=active" : ""}`;
  const online = accounts.filter((u) => u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < ONLINE_MS).length;

  return (
    <>
      <AdminHeader
        eyebrow="People"
        title="Customers"
        description="Accounts, people who ordered as a guest, and staff. Open anyone to edit their details, send a password reset or see their orders."
        actions={
          <Link href="/admin/customers/new" className="btn-solid gap-2">
            <Plus className="size-4" strokeWidth={1.5} /> New customer
          </Link>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Accounts" value={String(counts.accounts)} href={href("accounts")} />
        <StatTile index={1} label="Guest buyers" value={String(counts.guests)} sub="Ordered without an account" href={href("guests")} />
        <StatTile index={2} label="Staff" value={String(counts.staff)} href={href("staff")} />
      </div>

      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          items={[
            { href: href("accounts"), label: "Accounts", active: view === "accounts", count: counts.accounts },
            { href: href("guests"), label: "Guests", active: view === "guests", count: counts.guests },
            { href: href("staff"), label: "Staff", active: view === "staff", count: counts.staff },
          ]}
        />
        {view === "accounts" && (
          <Segmented
            items={[
              { href: href(view, "new"), label: "Newest", active: sort === "new" },
              { href: href(view, "active"), label: online ? `Active · ${online} online` : "Recently active", active: sort === "active" },
            ]}
          />
        )}
        <form className="flex w-full max-w-sm gap-2 sm:w-auto">
          <input type="hidden" name="view" value={view} />
          {sort === "active" && <input type="hidden" name="sort" value="active" />}
          <input name="q" defaultValue={q} placeholder="Search name or email" className="input py-2.5" />
          <button className="btn-solid shrink-0 py-2.5">Search</button>
        </form>
      </div>
      {sp.deleted && <p className="mb-3 text-[12px] text-emerald-700">Account deleted. Their orders are kept as guest orders.</p>}

      <div className={table.wrap}>
        {view === "guests" ? (
          <table className={cx(table.table, "min-w-[640px]")}>
            <thead className={table.head}>
              <tr>
                <th>Guest</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Spent</th>
                <th>Last order</th>
                <th />
              </tr>
            </thead>
            <tbody className={table.body}>
              {guests.length === 0 && (
                <EmptyRow colSpan={5} icon={Users} title={q ? "No matches" : "No guest buyers"} body="People who check out without an account show up here, grouped by email." />
              )}
              {guests.map((g) => (
                <tr key={g.email}>
                  <td>
                    <p className="font-medium">{g.name ?? "—"}</p>
                    <p className="text-[12px] text-ash">{g.email}</p>
                  </td>
                  <td className="text-right tabular-nums">{g.orders}</td>
                  <td className="text-right tabular-nums">{formatMoney(g.spent)}</td>
                  <td className="text-ash">{g.last ? formatDate(g.last) : "—"}</td>
                  <td className="text-right">
                    <Link
                      href={`/admin/customers/new?email=${encodeURIComponent(g.email ?? "")}&name=${encodeURIComponent(g.name ?? "")}`}
                      className="border border-black/15 px-3 py-1.5 text-[10px] tracking-[0.1em] whitespace-nowrap uppercase hover:border-ink"
                    >
                      Create account
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={cx(table.table, "min-w-[860px]")}>
            <thead className={table.head}>
              <tr>
                <th>{view === "staff" ? "Staff member" : "Customer"}</th>
                <th>Sign-in</th>
                <th>Last active</th>
                <th>Joined</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {accounts.length === 0 && (
                <EmptyRow
                  colSpan={7}
                  icon={Users}
                  title={q ? "No matches" : view === "staff" ? "No staff" : "No customers yet"}
                  body={q ? `Nobody matches “${q}”.` : "People who create an account (email, Google or Apple) appear here. You can also add someone yourself."}
                  action={{ label: "New customer", href: "/admin/customers/new" }}
                />
              )}
              {accounts.map((u) => (
                <RowLink key={u.id} href={`/admin/customers/${u.id}`}>
                  <td>
                    <Link href={`/admin/customers/${u.id}`} className="flex items-center gap-3">
                      <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-accent/25 font-semibold text-[#5a44cf] uppercase">
                        {(u.name || u.email).charAt(0)}
                        {u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < ONLINE_MS && (
                          <span title="On the store now" className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{u.name ?? "—"}</span>
                        <span className="block truncate text-[12px] text-ash">
                          {u.email}
                          {!u.emailVerifiedAt && <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 text-[10px] text-amber-800">unconfirmed</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="text-[12px]">{u.methods.join(" · ") || <span className="text-ash">{isProtectedStaff(u.email) ? "Staff passcode" : "No password yet"}</span>}</td>
                  <td className="text-[12px]">
                    {u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < ONLINE_MS ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> Online now
                      </span>
                    ) : u.lastSeenAt ? (
                      <span className="text-ash">{activeLabel(u.lastSeenAt, now) ?? formatDate(u.lastSeenAt)}</span>
                    ) : (
                      <span className="text-ash">—</span>
                    )}
                  </td>
                  <td className="text-ash">{formatDate(u.createdAt)}</td>
                  <td className="text-right tabular-nums">{u.orders}</td>
                  <td className="text-right tabular-nums">{formatMoney(u.spent)}</td>
                  <td className="text-ash">{u.lastOrder ? formatDate(u.lastOrder) : "—"}</td>
                </RowLink>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
