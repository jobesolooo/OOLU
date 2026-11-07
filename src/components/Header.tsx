"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, User, ShoppingBag, Menu, X, Heart } from "lucide-react";
import Image from "next/image";
import { useWishlist } from "@/store/saved";
import { useSession } from "@/store/session";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";
import { useCart, cartCount } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";
import { useT } from "./Prefs";
import { PreferencesMenu } from "./PreferencesMenu";
import { SearchModal } from "./SearchModal";

/** Pages that open with a full-bleed dark hero; the header is transparent over them until you scroll. */
const HERO_PATHS = ["/", "/shop", "/help", "/journal", "/legal", "/wishlist", "/gift-cards", "/search", "/collections", "/drops", "/track", "/about"];

export function Header() {
  const pathname = usePathname();
  const t = useT();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useMounted();
  const count = mounted ? cartCount(lines) : 0;
  const saved = useWishlist((s) => s.items.length);
  const me = useSession((s) => s.user);
  const savedCount = mounted && me ? saved : 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Menu + search close themselves whenever the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  // While the mobile menu is open: Escape closes it and the page behind can't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Over a full-bleed hero the header floats transparently until you scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Pages that open with a full-bleed dark hero get the transparent header too.
  const overHero = HERO_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)))
    // Signed-in account pages open on a photo hero too (sign-in/up pages don't).
    || (/^\/account(\/|$)/.test(pathname) && !/^\/account\/(login|register|forgot|reset|verify|confirm-email)/.test(pathname));
  const clear = overHero && !scrolled && !searchOpen;
  const badge = clear ? "bg-white text-black" : "bg-ink text-white";

  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b transition-[background-color,color,border-color,box-shadow] duration-500",
        clear ? "border-transparent bg-transparent text-white" : "border-black/5 bg-white text-ink",
        scrolled && "shadow-[0_6px_24px_-12px_rgba(0,0,0,0.18)]",
      )}
    >
      <div className="container-x grid h-[var(--nav-h)] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">
          <button className="-ml-1 p-1 md:hidden" aria-label={t("nav.openMenu")} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <nav className="hidden items-center gap-[clamp(18px,2vw,32px)] md:flex" aria-label={t("a11y.main")}>
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "group/nav relative py-2 text-[12px] tracking-[0.04em] uppercase",
                )}
              >
                {t(item.key)}
                <span
                  className={cx(
                    "absolute inset-x-0 bottom-1 h-px origin-left bg-current transition-transform duration-300 ease-out",
                    isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                  )}
                />
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label={t("nav.home.aria", { name: site.name })} className="block">
          <Image src="/images/brand/logo.png" alt={site.name} width={70} height={80} priority className="h-[clamp(36px,3.4vw,52px)] w-auto" />
        </Link>

        <div className="flex items-center justify-end gap-5 md:gap-6">
          <div className="hidden md:block">
            <PreferencesMenu />
          </div>
          <button aria-label={t("nav.search")} onClick={() => setSearchOpen(true)} className="grid size-9 place-items-center sm:size-auto">
            <Search className="size-[19px]" strokeWidth={1.5} />
          </button>
          <Link href="/account/wishlist" aria-label={t("nav.wishlistAria", { count: savedCount })} className="relative hidden sm:block">
            <Heart className="size-[19px]" strokeWidth={1.5} />
            {savedCount > 0 && (
              <span className={cx("absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full text-[9px] font-bold", badge)}>
                {savedCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label={me ? `${t("nav.account")} (${me.name ?? me.email})` : t("nav.signIn")} className="flex items-center">
            {me ? (
              <span className={cx("grid size-[26px] place-items-center rounded-full text-[11px] font-bold uppercase", badge)}>
                {(me.name ?? me.email).trim().charAt(0)}
              </span>
            ) : (
              <User className="size-[19px]" strokeWidth={1.5} />
            )}
          </Link>
          <button aria-label={t("nav.cartAria", { count })} className="relative" onClick={() => setOpen(true)}>
            <ShoppingBag className="size-[19px]" strokeWidth={1.5} />
            {count > 0 && (
              <span key={count} className={cx("animate-pop absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full text-[9px] font-bold", badge)}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={closeSearch} />

      {/* Mobile menu: slides in from the left, closes on any tap of a link, the backdrop or Escape */}
      <div className={cx("md:hidden", !menuOpen && "pointer-events-none")} aria-hidden={!menuOpen}>
        <div
          className={cx("fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          aria-label={t("a11y.mobile")}
          inert={!menuOpen}
          onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}
          className={cx(
            "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[360px] flex-col bg-white text-ink shadow-[24px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[var(--nav-h)] items-center justify-between border-b border-black/10 px-5">
            <Image src="/images/brand/logo-mark.png" alt={site.name} width={40} height={38} className="h-9 w-auto" />
            <button aria-label={t("nav.closeMenu")} onClick={() => setMenuOpen(false)} className="p-1 transition-transform duration-300 hover:rotate-90">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {site.nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "block border-b border-black/10 py-4 font-display text-[26px] leading-none tracking-[-0.02em] transition-all duration-500",
                  menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                  isActive(item.href) && "text-accent",
                )}
                style={{ transitionDelay: menuOpen ? `${120 + i * 50}ms` : "0ms" }}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-x-4">
              {(
                [
                  ["nav.wishlist", "/account/wishlist"],
                  ["nav.account", "/account"],
                  ["nav.giftCards", "/gift-cards"],
                  ["nav.track", "/track"],
                  ["nav.help", "/help"],
                ] as const
              ).map(([key, href]) => (
                <Link key={href} href={href} className="py-3 text-[11px] tracking-[0.08em] text-black/60 uppercase hover:text-ink">
                  {t(key)}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
              className="mt-2 flex w-full items-center gap-3 border border-black/15 px-4 py-3.5 text-left text-[12px] text-black/60"
            >
              <Search className="size-4" strokeWidth={1.5} /> {t("nav.searchPlaceholder")}
            </button>
            <div className="mt-6 border-t border-black/10 pt-5">
              <PreferencesMenu variant="panel" />
            </div>
          </div>
          <p className="border-t border-black/10 px-5 py-4 text-[11px] tracking-[0.06em] text-accent uppercase">
            {site.name} · {t("brand.established")}
          </p>
        </nav>
      </div>
    </header>
  );
}
