import Link from "next/link";
import { BellRing, Mail } from "lucide-react";
import { listAlerts, listSubscribers, subscriberCounts } from "@/lib/admin-subscribers";
import { cx, formatDate } from "@/lib/format";
import { variantLabel } from "@/lib/variants";
import { AdminForm } from "../FormMessage";
import { EmptyRow } from "../Empty";
import { AdminHeader, Segmented, StatTile, ghostBtn, table } from "../ui";
import { addSubscribers, saveSubscriber, subscriberAction } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

const VIEWS = ["active", "unsubscribed", "alerts"] as const;
type View = (typeof VIEWS)[number];

const cls = (danger?: boolean) =>
  cx(
    "border px-2.5 py-1.5 text-[10px] tracking-[0.08em] whitespace-nowrap uppercase transition-colors",
    danger ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-black/15 hover:border-ink",
  );

function RowButton({ id, action, label, danger, confirm }: { id: string; action: string; label: string; danger?: boolean; confirm?: string }) {
  return (
    <form action={subscriberAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      {confirm ? (
        <ConfirmButton message={confirm} className={cls(danger)}>
          {label}
        </ConfirmButton>
      ) : (
        <button className={cls(danger)}>{label}</button>
      )}
    </form>
  );
}

export default async function SubscribersAdmin({ searchParams }: PageProps<"/admin/subscribers">) {
  const sp = await searchParams;
  const view: View = VIEWS.find((v) => v === sp.view) ?? "active";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const [counts, rows, alerts] = await Promise.all([
    subscriberCounts(),
    view === "alerts" ? Promise.resolve([]) : listSubscribers(view, q),
    view === "alerts" ? listAlerts(q) : Promise.resolve([]),
  ]);
  const editing = typeof sp.edit === "string" ? rows.find((r) => r.id === sp.edit) : undefined;
  const href = (v: View) => `/admin/subscribers?view=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <AdminHeader
        eyebrow="People"
        title="Subscribers"
        description="Your newsletter list and the people waiting for restock or drop alerts. Add people yourself, fix typos, or remove anyone."
        actions={
          <a href={`/admin/subscribers/export?view=${view === "alerts" ? "active" : view}`} className={ghostBtn}>
            Export CSV
          </a>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Subscribed" value={String(counts.active)} href={href("active")} />
        <StatTile index={1} label="Unsubscribed" value={String(counts.unsubscribed)} href={href("unsubscribed")} />
        <StatTile index={2} label="Waiting on alerts" value={String(counts.alerts)} sub="Restock & drop" href={href("alerts")} />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-fit space-y-3 xl:sticky xl:top-6">
          {editing ? (
            <section className="bg-white p-6 ring-1 ring-black/5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Edit subscriber</h2>
                <Link href={href(view)} className="text-[11px] text-ash underline">
                  Cancel
                </Link>
              </div>
              <AdminForm key={editing.id} action={saveSubscriber} submitLabel="Save email" className="mt-4">
                <input type="hidden" name="id" value={editing.id} />
                <input name="email" type="email" required defaultValue={editing.email} className="input" />
                <p className="mt-2 text-[12px] text-ash">
                  Joined {formatDate(editing.createdAt)} via {editing.source ?? "site"}
                  {editing.promoCode && <> · code <span className="font-mono">{editing.promoCode}</span></>}
                </p>
              </AdminForm>
            </section>
          ) : (
            <section className="bg-white p-6 ring-1 ring-black/5">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">Add subscribers</h2>
              <p className="mt-2 text-[12px] text-ash">One email, or paste a whole list (one per line or separated by commas).</p>
              <AdminForm action={addSubscribers} submitLabel="Add to list" className="mt-4 space-y-3">
                <textarea name="emails" rows={4} required placeholder={"name@example.com\nfriend@example.com"} className="input font-mono text-[13px]" />
                <label className="flex items-start gap-2.5 text-[13px] leading-snug">
                  <input type="checkbox" name="welcome" className="mt-0.5 size-[18px] shrink-0 accent-ink" />
                  <span>
                    Send the welcome email + personal discount code
                    <span className="block text-[12px] text-ash">Only for people who are new to the list. Only tick this if they agreed to get emails.</span>
                  </span>
                </label>
              </AdminForm>
            </section>
          )}
          {sp.saved && <p className="px-1 text-[12px] text-emerald-700">Subscriber updated.</p>}
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              items={[
                { href: href("active"), label: "Subscribed", active: view === "active", count: counts.active },
                { href: href("unsubscribed"), label: "Unsubscribed", active: view === "unsubscribed", count: counts.unsubscribed },
                { href: href("alerts"), label: "Alerts", active: view === "alerts", count: counts.alerts },
              ]}
            />
            <form className="flex w-full max-w-xs gap-2 sm:w-auto">
              <input type="hidden" name="view" value={view} />
              <input name="q" defaultValue={q} placeholder="Search email" className="input py-2.5" />
            </form>
          </div>

          <div className={table.wrap}>
            {view === "alerts" ? (
              <table className={cx(table.table, "min-w-[640px]")}>
                <thead className={table.head}>
                  <tr>
                    <th>Email</th>
                    <th>Waiting for</th>
                    <th>Since</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {alerts.length === 0 && (
                    <EmptyRow colSpan={4} icon={BellRing} title="Nobody waiting" body="When someone taps “Notify me” on a sold-out size or an upcoming drop, they show up here. They're emailed automatically when it's back." />
                  )}
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.email}</td>
                      <td>
                        {a.product ? (
                          <a href={`/products/${a.product.slug}`} target="_blank" rel="noreferrer" className="hover:underline">
                            {a.product.name}
                          </a>
                        ) : (
                          <span className="text-ash">Removed product</span>
                        )}
                        {a.size && <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px]">{a.size === "One Size" ? "One size" : variantLabel(a.size)}</span>}
                      </td>
                      <td className="text-ash">{formatDate(a.createdAt)}</td>
                      <td>
                        <div className="flex justify-end">
                          <RowButton id={a.id} action="deleteAlert" label="Remove" danger />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className={cx(table.table, "min-w-[600px]")}>
                <thead className={table.head}>
                  <tr>
                    <th>Email</th>
                    <th className="whitespace-nowrap">Welcome code</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {rows.length === 0 && (
                    <EmptyRow
                      colSpan={3}
                      icon={Mail}
                      title={q ? "No matches" : view === "active" ? "No subscribers yet" : "Nobody has unsubscribed"}
                      body={view === "active" ? "Sign-ups from the popup, footer, homepage and account settings land here. You can add people with the form too." : undefined}
                    />
                  )}
                  {rows.map((s) => (
                    <tr key={s.id} className={cx(editing?.id === s.id && "bg-accent/10")}>
                      <td className="min-w-0">
                        <span className="block break-all">{s.email}</span>
                        <span className="mt-0.5 block text-[11px] text-ash">
                          <span className="capitalize">{s.source ?? "site"}</span> · {view === "active" ? "joined" : "left"}{" "}
                          {formatDate(view === "active" ? s.createdAt : (s.unsubscribedAt ?? s.createdAt))}
                          {s.accountId && (
                            <>
                              {" · "}
                              <Link href={`/admin/customers/${s.accountId}`} className="text-[#5a44cf] hover:underline">
                                account →
                              </Link>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] whitespace-nowrap">{s.promoCode ?? "—"}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/admin/subscribers?view=${view}&edit=${s.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="border border-black/15 px-2.5 py-1.5 text-[10px] tracking-[0.08em] uppercase hover:border-ink">
                            Edit
                          </Link>
                          {view === "active" ? (
                            <>
                              <RowButton id={s.id} action="welcome" label="Welcome email" />
                              <RowButton id={s.id} action="unsubscribe" label="Unsubscribe" />
                            </>
                          ) : (
                            <RowButton id={s.id} action="resubscribe" label="Resubscribe" />
                          )}
                          <RowButton id={s.id} action="delete" label="Delete" danger confirm={`Delete ${s.email} from the list completely?`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-[12px] text-ash">Unsubscribe keeps the email on file so they aren&apos;t added back by accident. Delete removes it completely (for privacy requests).</p>
        </div>
      </div>
    </>
  );
}
