import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { NewsletterForm } from "./Newsletter";
import { InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from "./icons";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "New arrivals", href: "/shop?sort=new" },
      { label: "T-Shirts", href: "/shop?category=t-shirts" },
      { label: "Caps", href: "/shop?category=caps" },
      { label: "Sale", href: "/shop?sale=1" },
      { label: "Gift cards", href: "/gift-cards" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Track your order", href: "/track" },
      { label: "Shipping", href: "/help#shipping" },
      { label: "Returns", href: "/help#returns" },
      { label: "Size guide", href: "/help#sizing" },
      { label: "Contact us", href: "/help/contact" },
    ],
  },
  {
    title: "Wstablished",
    links: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Lookbook", href: "/journal?category=lookbook" },
      { label: "Upcoming drops", href: "/drops" },
      { label: "Account", href: "/account" },
    ],
  },
];

export function Footer() {
  const [l1, l2] = site.tagline.split(". ");
  return (
    <footer className="bg-ink text-white">
      {/* Links + newsletter */}
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-sm md:col-span-2 lg:col-span-1">
          <p className="eyebrow text-white/60">Join the movement</p>
          <p className="mt-3 font-display text-3xl leading-tight font-[800] uppercase">First on every drop.</p>
          <div className="mt-6">
            <NewsletterForm source="footer" dark />
          </div>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="eyebrow mb-5 text-white/60">{col.title}</h2>
            <ul className="space-y-3 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/85 hover:text-white hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Brand band from the mockup */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-bottom opacity-90" style={{ backgroundImage: `url(${site.footerImage})` }} aria-hidden />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
        <div className="container-x relative grid gap-10 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:py-[clamp(36px,4vw,64px)]">
          <Logo divider />
          <p className="border-white/40 text-[12px] leading-[1.8] tracking-[0.22em] uppercase md:border-l md:pl-9">
            {l1}.<br />
            {l2}
          </p>
          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex items-center gap-6">
              <a href={site.social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <InstagramIcon className="size-[18px]" />
              </a>
              <a href={site.social.tiktok} aria-label="TikTok" target="_blank" rel="noreferrer">
                <TikTokIcon className="size-[18px]" />
              </a>
              <a href={site.social.youtube} aria-label="YouTube" target="_blank" rel="noreferrer">
                <YouTubeIcon className="size-[19px]" />
              </a>
              <a href={site.social.x} aria-label="X" target="_blank" rel="noreferrer">
                <XIcon className="size-[16px]" />
              </a>
            </div>
            <Link href="/account/register" className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase">
              Join the movement <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="container-x flex flex-col gap-3 py-6 text-[11px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
          <Link href="/legal/returns" className="hover:text-white">Returns policy</Link>
          <Link href="/legal/imprint" className="hover:text-white">Imprint</Link>
        </nav>
      </div>
    </footer>
  );
}
