import Link from "next/link";
import { site, CATEGORIES } from "@/lib/site";
import { PaymentIcons } from "./PaymentIcons";
import { NewsletterForm } from "./Newsletter";
import { InstagramIcon, TikTokIcon } from "./icons";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "New arrivals", href: "/shop?sort=new" },
      ...CATEGORIES.filter((c) => c.slug !== "hoodies").map((c) => ({ label: c.label, href: `/shop?category=${c.slug}` })),
      { label: "Gift cards", href: "/gift-cards" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/help/contact" },
      { label: "Help centre", href: "/help" },
      { label: "Track your order", href: "/track" },
      { label: "Shipping & returns", href: "/help#shipping" },
      { label: "Size guide", href: "/help#sizing" },
      { label: "Privacy policy", href: "/legal/privacy" },
    ],
  },
  {
    title: "Follow",
    links: [
      { label: "Journal", href: "/journal" },
      { label: "About OOLU", href: "/about" },
    ],
  },
] as { title: string; links: { label: string; href: string; external?: boolean }[] }[];

const SOCIALS = [
  { name: "Instagram", href: site.social.instagram, handle: site.socialHandles.instagram, Icon: InstagramIcon, hover: "hover:bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)]" },
  { name: "TikTok", href: site.social.tiktok, handle: site.socialHandles.tiktok, Icon: TikTokIcon, hover: "hover:bg-white hover:text-black" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x pt-[clamp(56px,6vw,96px)]">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <p className="text-[12px] tracking-[0.06em] text-accent uppercase">
              {site.name} · {site.established}
            </p>
            <p className="mt-5 font-display text-[clamp(24px,2vw,32px)] leading-[1.1] tracking-[-0.02em]">{site.tagline}</p>
            <div className="mt-8 max-w-sm">
              <NewsletterForm source="footer" dark cta="Join" />
            </div>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-5 text-[12px] tracking-[0.06em] text-accent uppercase">{col.title}</h2>
              {col.title === "Follow" && (
                <ul className="mb-5 space-y-3">
                  {SOCIALS.map(({ name, href, handle, Icon, hover }) => (
                    <li key={name}>
                      <a href={href} target="_blank" rel="noreferrer" aria-label={`${site.name} on ${name} (${handle})`} className="group/s flex items-center gap-3 text-[12px] tracking-[0.04em]">
                        <span className={`grid size-9 place-items-center rounded-full bg-white/10 transition-all duration-300 group-hover/s:scale-110 ${hover}`}>
                          <Icon className="size-[17px]" />
                        </span>
                        <span className="text-white/90 group-hover/s:text-white">{handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="space-y-3.5 text-[12px] tracking-[0.04em] uppercase">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-[clamp(48px,5vw,80px)] flex flex-col gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <PaymentIcons />
          <a href="#top" className="text-[12px] tracking-[0.06em] uppercase hover:underline underline-offset-4">
            Back to top ↑
          </a>
        </div>

        {/* Giant wordmark */}
        <p
          aria-hidden
          data-reveal
          className="mt-[clamp(24px,3vw,48px)] text-center font-wordmark leading-[0.8] text-[#f3f2ef] select-none"
          style={{ fontSize: "clamp(120px, 26vw, 420px)" }}
        >
          {site.wordmark}
        </p>

        <div className="mt-[clamp(24px,3vw,40px)] flex flex-col gap-3 border-t border-white/15 py-6 text-[11px] tracking-[0.04em] text-white/60 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.motto}.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 normal-case">
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
            <Link href="/legal/returns" className="hover:text-white">Returns policy</Link>
            <Link href="/legal/imprint" className="hover:text-white">Imprint</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
