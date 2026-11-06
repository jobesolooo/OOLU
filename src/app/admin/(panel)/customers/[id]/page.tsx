import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAccount, isProtectedStaff } from "@/lib/admin-users";
import { getProducts } from "@/lib/catalog";
import { isStripeConfigured, stripeDashboardUrl } from "@/lib/stripe";
import { cx, formatDate, formatMoney } from "@/lib/format";
import { Stars } from "@/components/Price";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AdminForm } from "../../FormMessage";
import { AdminHeader, Panel, StatTile, ghostBtn } from "../../ui";
import { createCustomer, customerTool, removeCustomer, saveCustomer } from "../actions";

const check = "flex items-start gap-2.5 text-[13px] leading-snug";
const box = "mt-0.5 size-[18px] shrink-0 accent-ink";

export default async function CustomerPage({ params, searchParams }: PageProps<"/admin/customers/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const back = (
    <Link href="/admin/customers" className="group mb-4 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-ash uppercase hover:text-ink">
      <span className="transition-transform group-hover:-translate-x-1">←</span> Customers
    </Link>
  );

  /* ── New account ── */
  if (id === "new") {
    return (
      <>
        {back}
        <AdminHeader eyebrow="People" title="New customer" description="Creates an account with this email. They choose their own password from the invite email, or sign in with Google/Apple using the same email." />
        <div className="max-w-2xl bg-white p-6 ring-1 ring-black/5">
          <AdminForm action={createCustomer} submitLabel="Create account" className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
              <input name="name" defaultValue={one(sp.name)} placeholder="Name" className="input" />
              <input name="email" type="email" required defaultValue={one(sp.email)} placeholder="Email" className="input" />
            </div>
            <div className="space-y-2.5 pt-2">
              <label className={check}>
                <input type="checkbox" name="invite" defaultChecked className={box} />
                <span>
                  Email them an invite to choose a password
                  <span className="block text-[12px] text-ash">The link works for 7 days.</span>
                </span>
              </label>
              <label className={check}>
                <input type="checkbox" name="verified" defaultChecked={Boolean(one(sp.email))} className={box} />
                <span>
                  Email is confirmed
                  <span className="block text-[12px] text-ash">Also connects their past guest orders to the account.</span>
                </span>
              </label>
              <label className={check}>
                <input type="checkbox" name="staff" className={box} />
                <span>
                  Staff access
                  <span className="block text-[12px] text-ash">They can open this admin when signed in.</span>
                </span>
              </label>
            </div>
          </AdminForm>
        </div>
      </>
    );
  }

  /* ── Existing account ── */
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getAccount(id) : null;
  if (!data) notFound();
  const { user, orders, reviews, logins, subscribed, wishlist } = data;
  const products = new Map((await getProducts()).map((p) => [p.id, p]));
  const paid = orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const spent = paid.reduce((s, o) => s + o.total - o.refundedAmount, 0);
  const protectedStaff = isProtectedStaff(user.email);
  const isMe = user.id === me.id;
  const methods = [user.passwordHash && "Email & password", ...logins.map((l) => (l.provider === "google" ? "Google" : "Apple"))].filter(Boolean);

  const tool = (name: string, label: string, extra?: React.ReactNode) => (
    <AdminForm action={customerTool} submitLabel={label} className="[&_button]:w-full [&_button]:border [&_button]:border-black/15 [&_button]:bg-white [&_button]:py-3 [&_button]:text-ink [&_button:hover]:border-ink [&>div]:mt-0 [&>div]:flex-col [&>div]:items-stretch [&>div]:gap-1.5">
      <input type="hidden" name="id" value={user.id} />
      <input type="hidden" name="tool" value={name} />
      {extra}
    </AdminForm>
  );

  return (
    <>
      {back}
      <AdminHeader
        eyebrow={`${user.role === "admin" ? "Staff" : "Customer"} since ${formatDate(user.createdAt)}`}
        title={user.name || user.email}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{user.email}</span>
            <span className={cx("rounded-full px-2 py-0.5 text-[11px]", user.emailVerifiedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
              {user.emailVerifiedAt ? "Confirmed" : "Not confirmed"}
            </span>
            {sp.created && <span className="text-emerald-700">· Account created</span>}
            {sp.invite === "failed" && <span className="text-rose-700">· The invite email couldn&apos;t be sent; use “Send password reset email”</span>}
          </span>
        }
        actions={
          user.stripeCustomerId &&
          isStripeConfigured() && (
            <a href={stripeDashboardUrl(`/customers/${user.stripeCustomerId}`)} target="_blank" rel="noreferrer" className={ghostBtn}>
              Customer in Stripe ↗
            </a>
          )
        }
      />
      {sp.error && (
        <p className="mb-4 bg-rose-50 p-3 text-[13px] text-rose-800 ring-1 ring-rose-200">
          {sp.error === "self" ? "You can't delete your own account while signed in to it." : "The main staff account can't be deleted."}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatTile dark index={0} label="Spent" value={formatMoney(spent)} />
        <StatTile index={1} label="Orders" value={String(paid.length)} />
        <StatTile index={2} label="Wishlist" value={String(wishlist)} sub="saved items" />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-3">
          <Panel title="Details">
            <AdminForm action={saveCustomer} submitLabel="Save details" className="space-y-3">
              <input type="hidden" name="id" value={user.id} />
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-black/70 uppercase">Name</span>
                  <input name="name" defaultValue={user.name ?? ""} className="input" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-black/70 uppercase">Email</span>
                  <input name="email" type="email" required defaultValue={user.email} readOnly={protectedStaff} className={cx("input", protectedStaff && "bg-mist text-ash")} />
                </label>
              </div>
              <div className="space-y-2.5 pt-1">
                <label className={check}>
                  <input type="checkbox" name="verified" defaultChecked={Boolean(user.emailVerifiedAt)} className={box} />
                  Email is confirmed
                </label>
                <label className={cx(check, (protectedStaff || isMe) && "opacity-60")}>
                  <input type="checkbox" name="staff" defaultChecked={user.role === "admin"} disabled={protectedStaff || isMe} className={box} />
                  <span>
                    Staff access (can open this admin)
                    {(protectedStaff || isMe) && <input type="hidden" name="staff" value="on" />}
                  </span>
                </label>
              </div>
              <p className="text-[12px] text-ash">Changing the email or staff access signs them out everywhere.{user.stripeCustomerId && " Name and email are updated in Stripe too."}</p>
            </AdminForm>
          </Panel>

          <Panel title={`Orders (${orders.length})`} flush>
            {orders.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-ash">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-mist sm:px-6">
                      <span className="w-16 shrink-0 font-semibold">#{o.number}</span>
                      <span className="flex-1 text-[12px] text-ash">{formatDate(o.createdAt)}</span>
                      <OrderStatusBadge status={o.status} />
                      <span className="w-20 text-right text-[13px] tabular-nums">{formatMoney(o.total, o.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {reviews.length > 0 && (
            <Panel title={`Reviews (${reviews.length})`} action={{ label: "All reviews", href: "/admin/reviews" }} flush>
              <ul className="divide-y divide-black/5">
                {reviews.map((r) => (
                  <li key={r.id} className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <Stars value={r.rating} size={12} />
                      <span className="text-[12px] text-ash">{products.get(r.productId)?.name ?? r.productId}</span>
                      {r.status === "rejected" && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px]">Hidden</span>}
                    </div>
                    {r.title && <p className="mt-1 text-[13px] font-medium">{r.title}</p>}
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-black/70">{r.body}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-3 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Account">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ash">Signs in with</dt>
                <dd className="text-right">{methods.join(", ") || (protectedStaff ? "Staff username + passcode" : "No password yet")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ash">Newsletter</dt>
                <dd>{subscribed ? "Subscribed" : "Not subscribed"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ash">Stripe customer</dt>
                <dd className="truncate font-mono text-[11px]">{user.stripeCustomerId ?? "Created at first checkout"}</dd>
              </div>
            </dl>
            <div className="mt-5 space-y-2">
              {tool("reset", "Send password reset email")}
              {!user.emailVerifiedAt && tool("verify", "Send confirmation email")}
              {tool(subscribed ? "unsubscribe" : "subscribe", subscribed ? "Remove from newsletter" : "Add to newsletter", <input type="hidden" name="email" value={user.email} />)}
              {!isMe && tool("signout", "Sign out on all devices")}
            </div>
          </Panel>

          {!protectedStaff && !isMe && (
            <section className="bg-white p-5 ring-1 ring-rose-200 sm:p-6">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-rose-700 uppercase">Delete account</h2>
              <p className="mt-2 text-[12px] text-ash">Removes the account, wishlist and saved sign-ins. Orders are kept (as guest orders) and reviews stay up.</p>
              <AdminForm action={removeCustomer} submitLabel="Delete account" confirmText={`Delete ${user.email}? This can't be undone.`} className="mt-4 [&_button]:border [&_button]:border-rose-600 [&_button]:bg-rose-600">
                <input type="hidden" name="id" value={user.id} />
              </AdminForm>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
