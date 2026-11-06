"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, User, ShoppingBag, ChevronDown, Menu, X, Heart } from "lucide-react";
import { useWishlist } from "@/store/saved";
import { useSession } from "@/store/session";
import { site } from "@/lib/site";
import { cx } from "@/lib/format";
import { useCart, cartCount } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";
import { Logo } from "./Logo";

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-black text-white">
      <div className="container-x flex h-[var(--bar-h)] items-center justify-between text-[10px] font-medium tracking-[0.14em] uppercase sm:text-[11px]">
        <p className="truncate">{text}</p>
        <p className="hidden items-center gap-1 sm:flex">
          {site.region} <span className="text-white/50">/</span> {site.currency}
          <ChevronDown className="size-3" strokeWidth={1.5} />
        </p>
      </div>
    </div>
  );
}


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

  return (
    <header className="sticky top-0 z-40 bg-night text-white">
      <div className="container-x flex h-[var(--nav-h)] items-center justify-between">
        <button className="-ml-1 p-1 md:hidden" aria-label="Open menu" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
        </button>

        <Logo className="md:flex-1" />

        <nav className="hidden items-center gap-[clamp(24px,3.6vw,64px)] md:flex" aria-label="Main">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "relative py-2 text-[clamp(11px,0.95vw,14px)] font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-100",
                isActive(item.href) ? "opacity-100" : "opacity-85",
              )}
            >
              {item.label}
              {isActive(item.href) && <span className="absolute inset-x-0 -bottom-0.5 h-px bg-white" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-5 md:flex-1 md:gap-7">
          <button aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="hidden sm:block">
            <Search className="size-[21px]" strokeWidth={1.5} />
          </button>
          <Link href="/wishlist" aria-label={`Wishlist, ${savedCount} items`} className="relative hidden sm:block">
            <Heart className="size-[21px]" strokeWidth={1.5} />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full bg-white text-[9px] font-bold text-black">
                {savedCount}
              </span>
            )}
          </Link>
          <Link href="/account" aria-label={me ? `Account (${me.name ?? me.email})` : "Sign in"} className="flex items-center">
            {me ? (
              <span className="grid size-[26px] place-items-center rounded-full bg-white text-[11px] font-bold text-black uppercase">
                {(me.name ?? me.email).trim().charAt(0)}
              </span>
            ) : (
              <User className="size-[21px]" strokeWidth={1.5} />
            )}
          </Link>
          <button aria-label={`Cart, ${count} items`} className="relative" onClick={() => setOpen(true)}>
            <ShoppingBag className="size-[21px]" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 grid size-[16px] place-items-center rounded-full bg-white text-[9px] font-bold text-black">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-white/10 bg-night">
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
              placeholder="Search tees, caps, collections…"
              className="w-full bg-transparent py-2 text-sm placeholder:text-white/40 focus:outline-none"
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-white/10 md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-2">
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-white/10 py-4 text-xs tracking-[0.16em] uppercase">
                {item.label}
              </Link>
            ))}
            {[
              { label: "Wishlist", href: "/wishlist" },
              { label: "Gift cards", href: "/gift-cards" },
              { label: "Track order", href: "/track" },
              { label: "Help", href: "/help" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="border-b border-white/10 py-4 text-xs tracking-[0.16em] text-white/70 uppercase">
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
