"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Gift,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  RotateCcw,
  Settings,
  Shirt,
  ShoppingBag,
  Store,
  TicketPercent,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/format";
import { adminSignOut } from "./actions";

export type Badges = { orders: number; returns: number; messages: number; reviews: number };

type Item = { label: string; href: string; icon: LucideIcon; badge?: keyof Badges };
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Store",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: "orders" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Products", href: "/admin/products", icon: Shirt },
      { label: "Stock", href: "/admin/inventory", icon: Package },
      { label: "Discounts", href: "/admin/discounts", icon: TicketPercent },
      { label: "Gift cards", href: "/admin/gift-cards", icon: Gift },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw, badge: "returns" },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquareText, badge: "reviews" },
      { label: "Inbox", href: "/admin/messages", icon: Inbox, badge: "messages" },
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
    ],
  },
  { title: "Setup", items: [{ label: "Settings", href: "/admin/settings", icon: Settings }] },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <Image src="/images/brand/logo-mark.png" alt="" width={363} height={343} className="h-auto w-9" />
      <span className="leading-none">
        <span className="block font-wordmark text-[26px] tracking-[0.04em] text-white">OOLU</span>
        <span className="block text-[9px] font-semibold tracking-[0.3em] text-accent uppercase">Studio</span>
      </span>
    </Link>
  );
}

function NavBody({ pathname, badges, name, stripeUrl }: { pathname: string; badges: Badges; name: string; stripeUrl: string | null }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-6" aria-label="Admin">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.24em] text-white/35 uppercase">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ label, href, icon: Icon, badge }) => {
                const active = isActive(pathname, href);
                const n = badge ? badges[badge] : 0;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "group relative flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors",
                        active ? "bg-white/[0.07] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx("absolute inset-y-1.5 left-0 w-[2px] bg-accent transition-transform duration-300", active ? "scale-y-100" : "scale-y-0")}
                      />
                      <Icon className={cx("size-[17px] shrink-0", active ? "text-accent" : "text-white/45 group-hover:text-white/80")} strokeWidth={1.5} />
                      <span className="flex-1">{label}</span>
                      {n > 0 && <span className="min-w-5 rounded-full bg-accent px-1.5 py-px text-center text-[10px] font-semibold text-ink tabular-nums">{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="space-y-0.5 border-t border-white/10 pt-5">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 text-[12px] text-white/50 transition-colors hover:text-white">
            <Store className="size-4" strokeWidth={1.5} /> View store <ArrowUpRight className="ml-auto size-3.5" strokeWidth={1.5} />
          </a>
          {stripeUrl && (
            <a href={stripeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 text-[12px] text-white/50 transition-colors hover:text-white">
              <CreditCard className="size-4" strokeWidth={1.5} /> Stripe dashboard <ArrowUpRight className="ml-auto size-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-wordmark text-[18px] text-ink">{name.charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] text-white">{name}</span>
          <span className="block text-[10px] tracking-[0.12em] text-white/40 uppercase">Staff</span>
        </span>
        <form action={adminSignOut}>
          <button aria-label="Sign out" title="Sign out" className="grid size-9 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

/** Sidebar on desktop; top bar + slide-in drawer on phones (closes on navigation). */
export function AdminNav({ badges, name, stripeUrl }: { badges: Badges; name: string; stripeUrl: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(pathname);
  if (prev !== pathname) {
    setPrev(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  const total = badges.orders + badges.returns + badges.messages;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-[260px] shrink-0 flex-col bg-[#0b0b0c] lg:flex">
        <div className="border-b border-white/10 px-6 py-5">
          <Brand />
        </div>
        <NavBody pathname={pathname} badges={badges} name={name} stripeUrl={stripeUrl} />
      </aside>

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#0b0b0c] px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="relative grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <Menu className="size-5" strokeWidth={1.5} />
          {total > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-accent ring-2 ring-[#0b0b0c]" />}
        </button>
      </div>

      {/* Phone drawer */}
      <div className={cx("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
        <div className={cx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          inert={!open}
          className={cx(
            "absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-[#0b0b0c] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-full text-white/70 transition-transform duration-300 hover:rotate-90 hover:text-white">
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <NavBody pathname={pathname} badges={badges} name={name} stripeUrl={stripeUrl} />
        </div>
      </div>
    </>
  );
}
