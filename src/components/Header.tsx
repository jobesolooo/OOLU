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

  // On the homepage the header floats transparently over the hero until you scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const clear = pathname === "/" && !scrolled && !menuOpen && !searchOpen;
  const badge = clear ? "bg-white text-black" : "bg-ink text-white";

  return (
    <header
      className={cx(
        "sticky top-0 z-40 transition-colors duration-300",
        clear ? "bg-transparent text-white" : "border-b border-black/5 bg-white text-ink",
      )}
    >
      <div className="container-x grid h-[var(--nav-h)] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">
          <button className="-ml-1 p-1 md:hidden" aria-label="Open menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
          </button>
          <nav className="hidden items-center gap-[clamp(18px,2vw,32px)] md:flex" aria-label="Main">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "relative py-2 text-[12px] tracking-[0.04em] uppercase underline-offset-[6px] hover:underline",
                  isActive(item.href) && "underline",
                )}
              >
                {item.label}
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
              <span className={cx("absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full text-[9px] font-bold", badge)}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-black/10 bg-white text-ink">
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

      {menuOpen && (
        <nav className="border-t border-black/10 bg-white text-ink md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-2">
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-black/10 py-4 text-xs tracking-[0.16em] uppercase">
                {item.label}
              </Link>
            ))}
            {[
              { label: "Wishlist", href: "/wishlist" },
              { label: "Gift cards", href: "/gift-cards" },
              { label: "Track order", href: "/track" },
              { label: "Help", href: "/help" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="border-b border-black/10 py-4 text-xs tracking-[0.16em] text-black/60 uppercase">
                {l.label}
              </Link>
            ))}
            <Link href="/search" onClick={() => setMenuOpen(false)} className="py-4 text-xs tracking-[0.16em] uppercase">
              Search
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
