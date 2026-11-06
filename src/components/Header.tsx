"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, User, ShoppingBag, ChevronDown, Menu, X, Heart } from "lucide-react";
import Image from "next/image";
import { useWishlist } from "@/store/saved";
import { useSession } from "@/store/session";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";
import { useCart, cartCount } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useMounted();
  const count = mounted ? cartCount(lines) : 0;
  const saved = useWishlist((s) => s.items.length);
  const savedCount = mounted ? saved : 0;
  const me = useSession((s) => s.user);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

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

  // On the homepage the header floats transparently over the hero until you scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const clear = pathname === "/" && !scrolled && !searchOpen;
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
          <button className="-ml-1 p-1 md:hidden" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <nav className="hidden items-center gap-[clamp(18px,2vw,32px)] md:flex" aria-label="Main">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "group/nav relative py-2 text-[12px] tracking-[0.04em] uppercase",
                )}
              >
                {item.label}
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

        <Link href="/" aria-label={`${site.name} home`} className="block">
          <Image src="/images/brand/logo.png" alt={site.name} width={70} height={80} priority className="h-[clamp(36px,3.4vw,52px)] w-auto" />
        </Link>

        <div className="flex items-center justify-end gap-5 md:gap-6">
          <span className="hidden items-center gap-1 text-[11px] font-medium tracking-[0.06em] lg:flex">
            {site.currency} <ChevronDown className="size-3" strokeWidth={1.5} />
          </span>
          <button aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="hidden sm:block">
            <Search className="size-[19px]" strokeWidth={1.5} />
          </button>
          <Link href="/wishlist" aria-label={`Wishlist, ${savedCount} items`} className="relative hidden sm:block">
            <Heart className="size-[19px]" strokeWidth={1.5} />
            {savedCount > 0 && (
              <span className={cx("absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full text-[9px] font-bold", badge)}>
                {savedCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label={me ? `Account (${me.name ?? me.email})` : "Sign in"} className="flex items-center">
            {me ? (
              <span className={cx("grid size-[26px] place-items-center rounded-full text-[11px] font-bold uppercase", badge)}>
                {(me.name ?? me.email).trim().charAt(0)}
              </span>
            ) : (
              <User className="size-[19px]" strokeWidth={1.5} />
            )}
          </Link>
          <button aria-label={`Cart, ${count} items`} className="relative" onClick={() => setOpen(true)}>
            <ShoppingBag className="size-[19px]" strokeWidth={1.5} />
            {count > 0 && (
              <span key={count} className={cx("animate-pop absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full text-[9px] font-bold", badge)}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-down border-t border-black/10 bg-white text-ink">
          <form
            className="container-x flex items-center gap-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              const q = inputRef.current?.value.trim();
              setSearchOpen(false);
              if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="size-4 opacity-60" strokeWidth={1.5} />
            <input
              ref={inputRef}
              name="q"
              placeholder="Search t-shirts, tracksuits, tanks…"
              className="w-full bg-transparent py-2 text-sm placeholder:text-black/40 focus:outline-none"
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
          </form>
        </div>
      )}

      {/* Mobile menu: slides in from the left, closes on any tap of a link, the backdrop or Escape */}
      <div className={cx("md:hidden", !menuOpen && "pointer-events-none")} aria-hidden={!menuOpen}>
        <div
          className={cx("fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          aria-label="Mobile"
          inert={!menuOpen}
          onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}
          className={cx(
            "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[360px] flex-col bg-white text-ink shadow-[24px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[var(--nav-h)] items-center justify-between border-b border-black/10 px-5">
            <Image src="/images/brand/logo-mark.png" alt={site.name} width={40} height={38} className="h-9 w-auto" />
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-1 transition-transform duration-300 hover:rotate-90">
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
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-x-4">
              {[
                { label: "Wishlist", href: "/wishlist" },
                { label: "Account", href: "/account" },
                { label: "Gift cards", href: "/gift-cards" },
                { label: "Track order", href: "/track" },
                { label: "Help", href: "/help" },
                { label: "Search", href: "/search" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="py-3 text-[11px] tracking-[0.08em] text-black/60 uppercase hover:text-ink">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="border-t border-black/10 px-5 py-4 text-[11px] tracking-[0.06em] text-accent uppercase">
            {site.name} · {site.established}
          </p>
        </nav>
      </div>
    </header>
  );
}
