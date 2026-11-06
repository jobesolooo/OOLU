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

  return (
    <>
      <PageHeader eyebrow={t("help.eyebrow")} title={t("help.title")} />
      <div className="container-x section-y">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, title: t("help.track"), href: "/track" },
            { icon: RefreshCw, title: t("help.return"), href: "/track" },
            { icon: Ruler, title: t("help.size"), href: "#sizing" },
            { icon: Mail, title: t("help.contact"), href: "/help/contact" },
          ].map((c) => (
            <Link key={c.title} href={c.href} className="group flex items-center justify-between bg-white p-6 hover:bg-ink hover:text-white">
              <span className="flex items-center gap-4">
                <c.icon className="size-6" strokeWidth={1.3} />
                <span className="text-[13px] font-semibold tracking-[0.12em] uppercase">{c.title}</span>
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[240px_1fr]">
          <nav aria-label={t("help.topics")} className="hidden lg:block">
            <ul className="sticky top-32 space-y-3 text-[14px]">
              {sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="hover:underline underline-offset-4">{s.title}</a></li>
              ))}
              <li><a href="#sizing" className="hover:underline underline-offset-4">{t("help.sizing")}</a></li>
            </ul>
          </nav>
          <div className="space-y-16">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-32">
                <h2 className="font-display font-normal tracking-[-0.02em] text-3xl">{s.title}</h2>
                <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
                  {s.faqs.map(([q, a]) => (
                    <details key={q} className="group py-5">
                      <summary className="flex items-center justify-between gap-6 text-[16px] font-medium">
                        {q}
                        <Plus className="rotate-open size-5 shrink-0 transition-transform" strokeWidth={1.3} />
                      </summary>
                      <div className="pt-3 text-[15px] leading-relaxed text-black/75">{a}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
            <section id="sizing" className="scroll-mt-32">
              <h2 className="font-display font-normal tracking-[-0.02em] text-3xl">{t("help.sizing")}</h2>
              <div className="mt-6 grid gap-10 xl:grid-cols-2">
                {Object.entries(SIZE_GUIDES).map(([cat, chart]) => (
                  <div key={cat}>
                    <h3 className="label mb-3 font-semibold">{t(`cat.${cat}` as MessageKey)}</h3>
                    <SizeGuideTable chart={chart} category={cat} />
                  </div>
                ))}
              </div>
            </section>
            <div className="bg-ink p-10 text-white">
              <h2 className="font-display font-normal tracking-[-0.02em] text-3xl">{t("help.still")}</h2>
              <p className="mt-3 text-white/75">{t("help.stillBody")}</p>
              <Link href="/help/contact" className="btn-outline mt-6">{t("help.contact")} <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
