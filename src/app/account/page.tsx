import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, MapPin, Package, RefreshCw } from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/orders";
import { getDb, schema } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { defaultAddress, getProfile, listAddresses } from "@/lib/account";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { AddressLines } from "@/components/account/AddressLines";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("acct.meta"), robots: { index: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const sp = await searchParams;
  const db = await getDb();
  const { t, locale } = await getT();
  const fmtDate = (d: Date | string) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(d));
  const [profile, orders, [wish], returns, addresses, home] = await Promise.all([
    getProfile(user.id),
    listOrdersForUser(user.id).then((o) => o.filter((x) => x.status !== "pending" && x.status !== "cancelled")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, user.id)),
    db
      .select({ r: schema.returnRequests, number: schema.orders.number })
      .from(schema.returnRequests)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.returnRequests.orderId))
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.returnRequests.createdAt))
      .limit(5),
    listAddresses(user.id),
    defaultAddress(user.id),
  ]);
  const openReturns = returns.filter((r) => ["requested", "approved", "received"].includes(r.r.status));
  const latest = orders[0];
  const notice = one(sp.welcome) ? t("acct.welcome") : one(sp.reset) ? t("acct.pwUpdated") : one(sp.email) ? t("ac.emailChanged") : null;

  // What's still missing from the profile, so checkout and recommendations are smoother.
  const todo = [
    !user.emailVerified && { label: t("ac.todoConfirm"), href: "/account/profile#email" },
    !home && { label: t("ac.todoAddress"), href: "/account/addresses?new=1" },
    !(profile?.sizeTop || profile?.sizeBottom) && { label: t("ac.todoSizes"), href: "/account/profile" },
    !profile?.phone && { label: t("ac.todoPhone"), href: "/account/profile" },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <AccountShell
      user={user}
      active="overview"
      notice={notice}
      tiles={[
        { icon: Package, label: t("acct.orders"), value: orders.length, href: "/account/orders" },
        { icon: RefreshCw, label: t("acct.openReturns"), value: openReturns.length, href: "/account/orders#returns" },
        { icon: Heart, label: t("acct.wishlist"), value: wish.n, href: "/wishlist" },
        { icon: MapPin, label: t("ac.nav.addresses"), value: addresses.length, href: "/account/addresses", accent: true },
      ]}
    >
      <AccountSection n={1} title={t("ac.latestOrder")} sub={latest ? t("ac.latestOrderSub") : undefined}>
        {latest ? (
          <Link href={`/account/orders/${latest.id}`} className="group flex flex-wrap items-center gap-x-8 gap-y-3 bg-white p-6 ring-1 ring-black/5 transition-colors hover:bg-ink hover:text-white sm:p-8">
            <span>
              <span className="block font-display text-[clamp(28px,2.6vw,40px)] leading-none tracking-[-0.02em]">#{latest.number}</span>
              <span className="mt-2 block text-[12px] opacity-60">{fmtDate(latest.createdAt)}</span>
            </span>
            <OrderStatusBadge status={latest.status} />
            <span className="ml-auto font-display text-[24px] tabular-nums">{formatMoney(latest.total, latest.currency)}</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        ) : (
          <AccountCard className="text-center">
            <p className="text-[14px] text-ash">{user.emailVerified ? t("acct.noOrders") : t("acct.noOrdersVerify")}</p>
            <Link href="/shop" className="btn-solid mt-6">
              {t("common.shopNow")}
            </Link>
          </AccountCard>
        )}
        {openReturns.length > 0 && (
          <div className="mt-4 bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.1em] uppercase">{t("acct.returnsInProgress")}</p>
            <ul className="space-y-2 text-[14px]">
              {openReturns.map(({ r, number }) => (
                <li key={r.id}>
                  <Link href={`/account/orders/${r.orderId}`} className="underline underline-offset-4">
                    {t("acct.orderNo", { number })}
                  </Link>{" "}
                  — {t(`ret.${r.status}` as MessageKey)}
                  <span className="text-ash"> · {fmtDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AccountSection>

      <AccountSection n={2} title={t("ac.deliverTo")} sub={t("ac.deliverToSub")}>
        {home ? (
          <AccountCard className="flex flex-wrap items-start justify-between gap-6">
            <AddressLines address={home} locale={locale} />
            <Link href="/account/addresses" className="text-[11px] tracking-[0.08em] uppercase underline underline-offset-4">
              {t("ac.manageAddresses")}
            </Link>
          </AccountCard>
        ) : (
          <Link href="/account/addresses?new=1" className="flex items-center justify-between gap-4 border border-dashed border-black/25 p-6 transition-colors hover:border-ink sm:p-8">
            <span className="font-display text-[22px] tracking-[-0.01em]">{t("ac.addFirstAddress")}</span>
            <ArrowRight className="size-5" strokeWidth={1.5} />
          </Link>
        )}
      </AccountSection>

      <AccountSection n={3} title={t("ac.yourDetails")} sub={todo.length ? t("ac.todoSub") : t("ac.allSet")}>
        <AccountCard>
          <dl className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
            {[
              [t("auth.name"), profile?.name || "—"],
              [t("auth.email"), user.email],
              [t("ac.phone"), profile?.phone || "—"],
              [t("ac.sizes"), [profile?.sizeTop && `${t("ac.top")} ${profile.sizeTop}`, profile?.sizeBottom && `${t("ac.bottom")} ${profile.sizeBottom}`].filter(Boolean).join(" · ") || "—"],
              [t("ac.memberSince"), profile ? fmtDate(profile.createdAt) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[11px] tracking-[0.08em] text-ash uppercase">{k}</dt>
                <dd className="mt-1 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {todo.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2 border-t border-black/10 pt-5">
              {todo.map((x) => (
                <li key={x.label}>
                  <Link href={x.href} className="inline-flex items-center gap-2 rounded-full bg-accent/25 px-4 py-2 text-[12px] transition-colors hover:bg-accent">
                    {x.label} <ArrowRight className="size-3.5" strokeWidth={1.5} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/account/profile" className="btn-solid mt-6">
            {t("ac.editDetails")}
          </Link>
        </AccountCard>
      </AccountSection>
    </AccountShell>
  );
}
