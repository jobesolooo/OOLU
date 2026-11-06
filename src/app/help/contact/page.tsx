import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Clock, LifeBuoy, MapPin, Package } from "lucide-react";
import { site } from "@/lib/site";
import { InstagramIcon, TikTokIcon } from "@/components/icons";
import { ContactForm } from "./ContactForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("contact.meta") };
}

export default async function ContactPage() {
  const { t } = await getT();

  const channels = [
    {
      href: site.social.instagram,
      external: true,
      title: site.socialHandles.instagram,
      body: t("contact.instagramBody"),
      icon: <InstagramIcon className="size-5" />,
      iconBg: "bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)] text-white",
    },
    {
      href: site.social.tiktok,
      external: true,
      title: site.socialHandles.tiktok,
      body: t("contact.tiktokBody"),
      icon: <TikTokIcon className="size-5" />,
      iconBg: "bg-white text-black",
    },
    {
      href: "/help",
      title: t("footer.helpCentre"),
      body: t("contact.helpBody"),
      icon: <LifeBuoy className="size-5" strokeWidth={1.5} />,
      iconBg: "bg-accent text-ink",
    },
    {
      href: "/track",
      title: t("footer.trackOrder"),
      body: t("contact.trackBody"),
      icon: <Package className="size-5" strokeWidth={1.5} />,
      iconBg: "bg-white/10 text-white",
    },
  ];

  return (
    <>
      {/* Hero: full-bleed photo, oversized headline */}
      <section className="relative isolate -mt-[var(--nav-h)] overflow-hidden bg-ink text-white">
        <div className="parallax absolute inset-0 -z-20">
          <Image src="/images/brand/tracksuit-duo-2.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[center_30%]" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,6,0.85),rgba(6,6,6,0.4)_55%,rgba(6,6,6,0.15)),linear-gradient(0deg,rgba(6,6,6,0.9),transparent_55%)]" />
        <div className="container-x flex min-h-[min(72svh,680px)] flex-col justify-end pt-24 pb-[clamp(120px,14vw,220px)]">
          <p className="rise text-[11px] tracking-[0.14em] text-accent uppercase" style={{ "--delay": "100ms" } as React.CSSProperties}>
            {t("contact.title")} · OOLU
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(64px,11vw,176px)] leading-[0.88] tracking-[-0.04em]" style={{ "--delay": "220ms" } as React.CSSProperties}>
            {t("contact.heroTitle")}
          </h1>
          <p className="rise mt-6 max-w-[520px] text-[13px] leading-[1.7] text-white/80" style={{ "--delay": "360ms" } as React.CSSProperties}>
            {t("contact.intro")}
          </p>
        </div>
      </section>

      {/* Form card overlapping the hero + dark channel cards */}
      <section className="relative flow-root bg-mist pb-[clamp(64px,8vw,128px)]">
        <div className="container-x relative z-10 -mt-[clamp(80px,10vw,160px)] grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <div data-reveal className="bg-white p-[clamp(24px,3.4vw,52px)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)]">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-black/10 pb-6">
              <h2 className="font-display text-[clamp(30px,3vw,44px)] leading-none tracking-[-0.02em]">{t("contact.formTitle")}</h2>
              <span className="flex items-center gap-2 text-[11px] text-ash">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {t("contact.response")}
              </span>
            </div>
            <ContactForm />
          </div>

          <div className="space-y-3">
            <div data-reveal className="bg-ink p-6 text-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
              <p className="text-[11px] tracking-[0.14em] text-accent uppercase">{t("contact.channels")}</p>
              <ul data-reveal="stagger" className="mt-5 divide-y divide-white/10">
                {channels.map((c) => {
                  const inner = (
                    <>
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 ${c.iconBg}`}>{c.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] tracking-[0.02em]">{c.title}</span>
                        <span className="block text-[12px] text-white/55">{c.body}</span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.5} />
                    </>
                  );
                  const cls = "group flex items-center gap-4 py-4";
                  return (
                    <li key={c.href}>
                      {c.external ? (
                        <a href={c.href} target="_blank" rel="noreferrer" className={cls}>
                          {inner}
                        </a>
                      ) : (
                        <Link href={c.href} className={cls}>
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div data-reveal className="relative overflow-hidden bg-accent p-6 text-ink">
              <Image
                src="/images/brand/logo-mark.png"
                alt=""
                width={363}
                height={343}
                className="spin pointer-events-none absolute -right-10 -bottom-10 w-44 opacity-25 mix-blend-multiply"
                aria-hidden
              />
              <p className="text-[11px] tracking-[0.14em] uppercase opacity-70">{t("contact.studio")}</p>
              <p className="mt-3 flex items-center gap-2 font-display text-[28px] leading-none tracking-[-0.02em]">
                <MapPin className="size-5" strokeWidth={1.5} /> {t("contact.studioBody")}
              </p>
              <p className="mt-4 flex items-center gap-2 text-[12px]">
                <Clock className="size-4" strokeWidth={1.5} /> {t("contact.hours")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
