import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Mail, Package, RefreshCw, Ruler } from "lucide-react";
import { Plus } from "lucide-react";
import { shippingConfig } from "@/lib/shipping";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import { SIZE_GUIDES } from "@/lib/demo-catalog";
import { PageHeader } from "@/components/PageHeader";
import { SizeGuideTable } from "@/components/product/SizeGuide";
import { getT } from "@/i18n/server";
import { getMoney } from "@/lib/rates";
import type { MessageKey } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("help.meta"), description: t("help.metaDesc") };
}

export default async function HelpPage() {
  const { freeShippingThreshold, flatRate } = shippingConfig();
  const [{ t }, { money }] = await Promise.all([getT(), getMoney()]);
  const free = money(freeShippingThreshold, "EUR", true);
  const flat = money(flatRate, "EUR", true);
  const link = (href: string, k: MessageKey) => (
    <Link href={href} className="underline">
      {t(k)}
    </Link>
  );

  const sections: { id: string; title: string; faqs: [string, React.ReactNode][] }[] = [
    {
      id: "orders",
      title: t("help.orders"),
      faqs: [
        [t("help.q.where"), <>{t("help.a.where1")} {link("/track", "help.a.where2")} {t("help.a.where3")} {link("/account", "help.a.where4")}.</>],
        [t("help.q.change"), t("help.a.change")],
        [t("help.q.account"), t("help.a.account")],
      ],
    },
    {
      id: "shipping",
      title: t("help.shipping"),
      faqs: [
        [t("help.q.cost"), t("help.a.cost", { free, flat })],
        [t("help.q.time"), t("help.a.time")],
        [t("help.q.world"), t("help.a.world")],
        [t("help.q.duties"), t("help.a.duties")],
      ],
    },
    {
      id: "returns",
      title: t("help.returns"),
      faqs: [
        [t("help.q.policy"), t("help.a.policy", { days: RETURN_WINDOW_DAYS })],
        [t("help.q.start"), <>{t("help.a.start1")} {link("/account", "help.a.where4")} {t("help.a.start2")} {link("/track", "help.a.where2")} {t("help.a.start3")}</>],
        [t("help.q.exchange"), t("help.a.exchange")],
        [t("help.q.refund"), t("help.a.refund")],
      ],
    },
    {
      id: "payments",
      title: t("help.payments"),
      faqs: [
        [t("help.q.methods"), t("help.a.methods")],
        [t("help.q.currency"), t("help.a.currency")],
        [t("help.q.code"), t("help.a.code")],
        [t("help.q.gift"), <>{t("help.a.gift")} {link("/gift-cards", "help.a.giftLink")}.</>],
      ],
    },
    {
      id: "products",
      title: t("help.products"),
      faqs: [
        [t("help.q.back"), t("help.a.back")],
        [t("help.q.drops"), <>{t("help.a.drops1")} {link("/drops", "help.a.drops2")} {t("help.a.drops3")}</>],
        [t("help.q.care"), t("help.a.care")],
      ],
    },
  ];

  const quick = [
    { icon: Package, title: t("help.track"), href: "/track", tone: "bg-white text-ink" },
    { icon: RefreshCw, title: t("help.return"), href: "/track", tone: "bg-white text-ink" },
    { icon: Ruler, title: t("help.size"), href: "#sizing", tone: "bg-white text-ink" },
    { icon: Mail, title: t("help.contact"), href: "/help/contact", tone: "bg-accent text-ink" },
  ];

  return (
    <>
      <PageHeader eyebrow={t("help.eyebrow")} title={t("help.title")} subtitle={t("help.subtitle")} image="/images/brand/look-friends.jpg" imagePosition="center 35%" word="HELP" />

      {/* Quick actions overlapping the hero */}
      <div className="relative z-10 container-x -mt-[clamp(28px,4vw,56px)] grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {quick.map((c, i) => (
          <Link
            key={c.title}
            href={c.href}
            className={`group flex min-h-[120px] flex-col justify-between p-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1 sm:min-h-[150px] sm:p-6 ${c.tone}`}
          >
            <span className="flex items-center justify-between">
              <c.icon className="size-6" strokeWidth={1.3} />
              <span className="font-wordmark text-[22px] leading-none opacity-20">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="font-display text-[clamp(18px,1.6vw,24px)] leading-tight tracking-[-0.01em]">{c.title}</span>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </span>
          </Link>
        ))}
      </div>

      {/* Topic pills (sticky, sideways scroll on phones) */}
      <div className="sticky top-[var(--nav-h)] z-20 mt-[clamp(32px,4vw,56px)] border-y border-black/10 bg-mist/95 backdrop-blur">
        <nav aria-label={t("help.topics")} className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
          {[...sections.map((s) => ({ id: s.id, title: s.title })), { id: "sizing", title: t("help.sizing") }].map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-black/15 bg-white px-4 py-2 text-[11px] tracking-[0.06em] whitespace-nowrap uppercase transition-colors hover:border-ink hover:bg-ink hover:text-white">
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-x py-[clamp(48px,6vw,96px)]">
        <div className="space-y-[clamp(56px,7vw,112px)]">
          {sections.map((s, si) => (
            <section key={s.id} id={s.id} className="grid scroll-mt-[calc(var(--nav-h)+80px)] grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
              <div data-reveal>
                <p className="font-wordmark text-[64px] leading-[0.8] text-accent">{String(si + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 font-display text-[clamp(30px,3vw,48px)] leading-none tracking-[-0.03em]">{s.title}</h2>
                <p className="mt-3 text-[11px] tracking-[0.08em] text-ash uppercase">{t("help.questions", { count: s.faqs.length })}</p>
              </div>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {s.faqs.map(([q, a]) => (
                  <details key={q} className="group py-1">
                    <summary className="flex items-center justify-between gap-6 py-4 text-[15px] transition-colors hover:text-[#5a44cf] sm:text-[16px]">
                      <span className="font-display text-[clamp(18px,1.6vw,22px)] leading-snug tracking-[-0.01em]">{q}</span>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-black/15 transition-colors group-open:border-accent group-open:bg-accent">
                        <Plus className="rotate-open size-4 transition-transform duration-300" strokeWidth={1.5} />
                      </span>
                    </summary>
                    <div className="pb-5 text-[14px] leading-[1.75] text-black/75">{a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section id="sizing" className="grid scroll-mt-[calc(var(--nav-h)+80px)] grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
            <div data-reveal>
              <p className="font-wordmark text-[64px] leading-[0.8] text-accent">{String(sections.length + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 font-display text-[clamp(30px,3vw,48px)] leading-none tracking-[-0.03em]">{t("help.sizing")}</h2>
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
              {Object.entries(SIZE_GUIDES).map(([cat, chart]) => (
                <div key={cat} className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
                  <h3 className="mb-3 font-display text-[22px] tracking-[-0.01em]">{t(`cat.${cat}` as MessageKey)}</h3>
                  <SizeGuideTable chart={chart} category={cat} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Still need help */}
      <section className="relative isolate overflow-hidden bg-[#0d0d0d] py-[clamp(64px,8vw,128px)] text-white">
        <p aria-hidden className="drift pointer-events-none absolute top-1/2 left-0 -z-10 font-wordmark leading-[0.8] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1.5px_rgba(165,146,255,0.22)]" style={{ fontSize: "clamp(180px, 26vw, 420px)" }}>
          HELLO HELLO HELLO
        </p>
        <div data-reveal className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-[clamp(44px,6vw,96px)] leading-[0.92] tracking-[-0.035em]">{t("help.still")}</h2>
            <p className="mt-4 text-[13px] text-white/70">{t("help.stillBody")}</p>
          </div>
          <Link href="/help/contact" className="group inline-flex items-center gap-3 bg-accent px-6 py-4 text-[11px] tracking-[0.08em] text-ink uppercase transition-colors hover:bg-white">
            {t("help.contact")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </>
  );
}
