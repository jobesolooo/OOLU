import Link from "next/link";
import { site, CATEGORIES } from "@/lib/site";
import { PaymentIcons } from "./PaymentIcons";
import { NewsletterForm } from "./Newsletter";
import { InstagramIcon, TikTokIcon } from "./icons";
import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";

type Col = { title: MessageKey; links: { label: MessageKey; href: string }[] };
const COLUMNS: Col[] = [
  {
    title: "footer.shop",
    links: [
      { label: "footer.allProducts", href: "/shop" },
      { label: "footer.newArrivals", href: "/shop?sort=new" },
      ...CATEGORIES.filter((c) => c.slug !== "hoodies").map((c) => ({ label: `cat.${c.slug}` as MessageKey, href: `/shop?category=${c.slug}` })),
      { label: "nav.giftCards", href: "/gift-cards" },
    ],
  },
  {
    title: "footer.help",
    links: [
      { label: "nav.contact", href: "/help/contact" },
      { label: "footer.helpCentre", href: "/help" },
      { label: "footer.trackOrder", href: "/track" },
      { label: "footer.shippingReturns", href: "/help#shipping" },
      { label: "footer.sizeGuide", href: "/help#sizing" },
      { label: "footer.privacy", href: "/legal/privacy" },
    ],
  },
  {
    title: "footer.follow",
    links: [
      { label: "nav.journal", href: "/journal" },
      { label: "footer.about", href: "/about" },
    ],
  },
];

const SOCIALS = [
  { name: "Instagram", href: site.social.instagram, handle: site.socialHandles.instagram, Icon: InstagramIcon, hover: "hover:bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)]" },
  { name: "TikTok", href: site.social.tiktok, handle: site.socialHandles.tiktok, Icon: TikTokIcon, hover: "hover:bg-white hover:text-black" },
];

export async function Footer() {
  const { t } = await getT();
  return (
    <footer className="bg-ink text-white">
      <div className="container-x pt-[clamp(56px,6vw,96px)]">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <p className="text-[12px] tracking-[0.06em] text-accent uppercase">
              {site.name} · {t("brand.established")}
            </p>
            <p className="mt-5 font-display text-[clamp(24px,2vw,32px)] leading-[1.1] tracking-[-0.02em]">{t("brand.tagline")}</p>
            <div className="mt-8 max-w-sm">
              <NewsletterForm source="footer" dark cta={t("newsletter.join")} />
            </div>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={t(col.title)}>
              <h2 className="mb-5 text-[12px] tracking-[0.06em] text-accent uppercase">{t(col.title)}</h2>
              {col.title === "footer.follow" && (
                <ul className="mb-5 space-y-3">
                  {SOCIALS.map(({ name, href, handle, Icon, hover }) => (
                    <li key={name}>
                      <a href={href} target="_blank" rel="noreferrer" aria-label={t("footer.socialAria", { brand: site.name, network: name, handle })} className="group/s flex items-center gap-3 text-[12px] tracking-[0.04em]">
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
                    <Link href={l.href} className="text-white/90 underline-offset-4 hover:text-white hover:underline">
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-[clamp(48px,5vw,80px)] flex flex-col gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <PaymentIcons label={t("footer.paymentsAria")} />
          <a href="#top" className="text-[12px] tracking-[0.06em] uppercase hover:underline underline-offset-4">
            {t("footer.backToTop")}
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
            © {new Date().getFullYear()} {site.name}. {t("brand.motto")}.
          </p>
          <nav aria-label={t("footer.legal")} className="flex flex-wrap gap-x-6 gap-y-2 normal-case">
            <Link href="/legal/terms" className="hover:text-white">{t("footer.terms")}</Link>
            <Link href="/legal/privacy" className="hover:text-white">{t("footer.privacyShort")}</Link>
            <Link href="/legal/cookies" className="hover:text-white">{t("footer.cookies")}</Link>
            <Link href="/legal/returns" className="hover:text-white">{t("footer.returnsPolicy")}</Link>
            <Link href="/legal/imprint" className="hover:text-white">{t("footer.imprint")}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
