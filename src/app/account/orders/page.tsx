import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { getDb, schema } from "@/lib/db";
import { cx, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.orders"), robots: { index: false } };
}

const FILTERS = ["all", "active", "done"] as const;

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const user = await requireUser("/account/orders");
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f === sp.show) ?? "all";
  const { t, locale } = await getT();
  const fmtDate = (d: Date | string) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(d));
  const db = await getDb();
  const [all, returns] = await Promise.all([
    listOrdersForUser(user.id).then((o) => o.filter((x) => x.status !== "pending" && x.status !== "cancelled")),
    db
      .select({ r: schema.returnRequests, number: schema.orders.number })
      .from(schema.returnRequests)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.returnRequests.orderId))
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.returnRequests.createdAt)),
  ]);
  const active = (s: string) => ["paid", "fulfilled", "shipped"].includes(s);
  const orders = all.filter((o) => (filter === "all" ? true : filter === "active" ? active(o.status) : !active(o.status)));

  return (
    <AccountShell user={user} active="orders" title={t("ac.nav.orders")}>
      <AccountSection n={1} title={t("acct.yourOrders")} sub={t("ac.ordersSub", { count: all.length })}>
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/account/orders" : `/account/orders?show=${f}`}
              className={cx(
                "rounded-full border px-4 py-2 text-[11px] tracking-[0.06em] uppercase transition-colors",
                f === filter ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:border-ink",
              )}
            >
              {t(`ac.filter.${f}` as MessageKey)}
            </Link>
          ))}
        </div>
        {orders.length === 0 ? (
          <AccountCard className="text-center">
            <p className="text-[14px] text-ash">{all.length ? t("ac.noneHere") : user.emailVerified ? t("acct.noOrders") : t("acct.noOrdersVerify")}</p>
            {!all.length && (
              <Link href="/shop" className="btn-solid mt-6">
                {t("common.shopNow")}
              </Link>
            )}
          </AccountCard>
        ) : (
          <ul className="divide-y divide-black/10 bg-white ring-1 ring-black/5">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="group flex flex-wrap items-center gap-x-6 gap-y-2 p-5 transition-colors hover:bg-mist sm:gap-x-8 sm:p-6">
                  <span className="w-20 font-display text-[22px] tracking-[-0.01em]">#{o.number}</span>
                  <span className="w-28 text-[13px] text-ash">{fmtDate(o.createdAt)}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="ml-auto text-[15px] tabular-nums">{formatMoney(o.total, o.currency)}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection n={2} id="returns" title={t("ac.returns")} sub={t("ac.returnsSub")}>
        {returns.length === 0 ? (
          <AccountCard>
            <p className="text-[14px] text-ash">{t("ac.noReturns")}</p>
          </AccountCard>
        ) : (
          <ul className="divide-y divide-black/10 bg-white ring-1 ring-black/5">
            {returns.map(({ r, number }) => (
              <li key={r.id}>
                <Link href={`/account/orders/${r.orderId}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5 transition-colors hover:bg-mist sm:p-6">
                  <span className="font-medium">{t("acct.orderNo", { number })}</span>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] tracking-[0.06em] uppercase">{t(`ret.${r.status}` as MessageKey)}</span>
                  <span className="ml-auto text-[13px] text-ash">{fmtDate(r.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>
    </AccountShell>
  );
}
