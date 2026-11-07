import Link from "next/link";
import { ArrowRight, LogOut, type LucideIcon } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { cx } from "@/lib/format";
import { logout } from "@/app/account/actions";
import { PageHeader } from "@/components/PageHeader";
import { VerifyBanner } from "./VerifyBanner";
import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";

export const ACCOUNT_TABS = [
  { key: "overview", label: "ac.nav.overview", href: "/account" },
  { key: "orders", label: "ac.nav.orders", href: "/account/orders" },
  { key: "wishlist", label: "ac.nav.wishlist", href: "/account/wishlist" },
  { key: "addresses", label: "ac.nav.addresses", href: "/account/addresses" },
  { key: "reviews", label: "ac.nav.reviews", href: "/account/reviews" },
  { key: "profile", label: "ac.nav.profile", href: "/account/profile" },
  { key: "security", label: "ac.nav.security", href: "/account/security" },
  { key: "privacy", label: "ac.nav.privacy", href: "/account/privacy" },
] as const satisfies readonly { key: string; label: MessageKey; href: string }[];

export type AccountTab = (typeof ACCOUNT_TABS)[number]["key"];

export type AccountTile = { icon: LucideIcon; label: string; value: string | number; href: string; accent?: boolean };

/**
 * Every account page: the same dark editorial hero as the rest of the store,
 * optional quick tiles overlapping it, a sticky row of section pills, then the page.
 */
export async function AccountShell({
  user,
  active,
  title,
  tiles,
  notice,
  children,
}: {
  user: CurrentUser & { createdAt?: Date };
  active: AccountTab;
  title?: string;
  tiles?: AccountTile[];
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = await getT();
  const first = user.name?.split(" ")[0];
  return (
    <>
      <PageHeader
        eyebrow={t("ac.eyebrow")}
        title={title ?? (first ? t("ac.hi", { name: first }) : t("ac.hiNoName"))}
        subtitle={user.email}
        image="/images/brand/tracksuit-duo.jpg"
        imagePosition="center 30%"
        word="OOLU"
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {user.role === "admin" && (
            <Link href="/admin" className="border border-white/40 px-4 py-2.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:bg-white hover:text-ink">
              {t("acct.admin")}
            </Link>
          )}
          <form action={logout}>
            <button className="inline-flex items-center gap-2 border border-white/40 px-4 py-2.5 text-[11px] tracking-[0.08em] uppercase transition-colors hover:bg-white hover:text-ink">
              <LogOut className="size-3.5" strokeWidth={1.5} /> {t("acct.signOut")}
            </button>
          </form>
        </div>
      </PageHeader>

      {tiles && (
        <div className="relative z-10 container-x -mt-[clamp(28px,4vw,56px)] grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {tiles.map((c, i) => (
            <Link
              key={c.label}
              href={c.href}
              className={cx(
                "group flex min-h-[120px] flex-col justify-between p-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1 sm:min-h-[150px] sm:p-6",
                c.accent ? "bg-accent text-ink" : "bg-white text-ink",
              )}
            >
              <span className="flex items-center justify-between">
                <c.icon className="size-6" strokeWidth={1.3} />
                <span className="font-wordmark text-[22px] leading-none opacity-20">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className="flex items-end justify-between gap-2">
                <span>
                  <span className="block font-display text-[clamp(30px,3vw,44px)] leading-none tracking-[-0.03em] tabular-nums">{c.value}</span>
                  <span className="mt-2 block text-[11px] tracking-[0.08em] uppercase opacity-70">{c.label}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className={cx("sticky top-[var(--nav-h)] z-20 border-y border-black/10 bg-mist/95 backdrop-blur", tiles ? "mt-[clamp(32px,4vw,56px)]" : "")}>
        <nav aria-label={t("auth.account")} className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
          {ACCOUNT_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={tab.key === active ? "page" : undefined}
              className={cx(
                "shrink-0 rounded-full border px-4 py-2 text-[11px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors",
                tab.key === active ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:border-ink",
              )}
            >
              {t(tab.label)}
            </Link>
          ))}
        </nav>
      </div>

      {!user.emailVerified && <VerifyBanner email={user.email} />}

      <div className="container-x py-[clamp(40px,6vw,96px)]">
        {notice && <div className="mb-10 border-l-2 border-accent bg-white p-5 text-[14px] leading-relaxed">{notice}</div>}
        <div className="space-y-[clamp(56px,7vw,112px)]">{children}</div>
      </div>
    </>
  );
}

/** Numbered section, the same layout as the help centre: big lavender number + title on the left, content right. */
export function AccountSection({
  n,
  title,
  sub,
  id,
  children,
}: {
  n: number;
  title: string;
  sub?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-[calc(var(--nav-h)+80px)] grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
      <div>
        <p className="font-wordmark text-[56px] leading-[0.8] text-accent sm:text-[64px]">{String(n).padStart(2, "0")}</p>
        <h2 className="mt-3 font-display text-[clamp(30px,3vw,44px)] leading-none tracking-[-0.03em]">{title}</h2>
        {sub && <p className="mt-3 max-w-[300px] text-[12px] leading-relaxed text-ash">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** White card used inside sections. */
export function AccountCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("bg-white p-5 ring-1 ring-black/5 sm:p-7", className)}>{children}</div>;
}
