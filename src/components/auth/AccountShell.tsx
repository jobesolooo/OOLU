import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { cx } from "@/lib/format";
import { logout } from "@/app/account/actions";
import { VerifyBanner } from "./VerifyBanner";
import { getT } from "@/i18n/server";

const TABS = [
  { key: "orders", label: "acct.tabOrders", href: "/account" },
  { key: "wishlist", label: "acct.wishlist", href: "/wishlist" },
  { key: "settings", label: "acct.tabSettings", href: "/account/settings" },
] as const;

export async function AccountShell({ user, active, children }: { user: CurrentUser; active: (typeof TABS)[number]["key"]; children: React.ReactNode }) {
  const first = user.name?.split(" ")[0];
  const { t } = await getT();
  return (
    <>
      <section className="grain relative bg-night text-white">
        <div className="container-x flex flex-wrap items-end justify-between gap-6 py-[clamp(48px,5vw,88px)]">
          <div className="flex items-center gap-5">
            <span className="grid size-16 place-items-center rounded-full bg-white font-display font-normal tracking-[-0.02em] text-2xl text-black">
              {(user.name ?? user.email).charAt(0)}
            </span>
            <div>
              <p className="eyebrow text-white/70">{t("auth.account")}</p>
              <h1 className="mt-2 font-display font-normal tracking-[-0.02em] text-[clamp(32px,3.4vw,56px)] leading-none">{t("acct.hey")}{first ? `, ${first}` : ""}</h1>
              <p className="mt-2 text-sm text-white/60">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {user.role === "admin" && (
              <Link href="/admin" className="btn-outline py-3">{t("acct.admin")}</Link>
            )}
            <form action={logout}>
              <button className="btn-outline py-3">{t("acct.signOut")}</button>
            </form>
          </div>
        </div>
        <nav className="container-x flex gap-8 overflow-x-auto" aria-label={t("auth.account")}>
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cx(
                "border-b-2 pb-4 text-[12px] font-medium tracking-[0.14em] whitespace-nowrap uppercase",
                tab.key === active ? "border-white" : "border-transparent text-white/60 hover:text-white",
              )}
            >
              {t(tab.label)}
            </Link>
          ))}
        </nav>
      </section>
      {!user.emailVerified && <VerifyBanner email={user.email} />}
      <div className="container-x section-y">{children}</div>
    </>
  );
}
