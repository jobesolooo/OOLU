import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/db/schema";
import type { ReviewSummary } from "@/lib/reviews";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import { Stars } from "../Price";
import { ReviewForm } from "./ReviewForm";

const FIT_KEY = { small: "reviews.small", true: "reviews.true", large: "reviews.large" } as const;

export async function Reviews({
  reviews,
  summary,
  productId,
  slug,
  sizes,
  canReview,
  signedIn,
  alreadyReviewed,
}: {
  reviews: Review[];
  summary: ReviewSummary;
  productId: string;
  slug: string;
  sizes: string[];
  canReview: boolean;
  signedIn: boolean;
  alreadyReviewed: boolean;
}) {
  const { t, locale } = await getT();
  const fmtDate = (d: Date | string) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(d));
  const fits = reviews.filter((r) => r.fit);
  const fitScore = fits.length ? fits.reduce((s, r) => s + (r.fit === "small" ? -1 : r.fit === "large" ? 1 : 0), 0) / fits.length : null;

  return (
    <section id="reviews" className="scroll-mt-24 bg-mist py-[clamp(56px,7vw,112px)]">
      <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          <p className="text-[11px] tracking-[0.14em] text-[#5a44cf] uppercase">{t("reviews.kicker")}</p>
          <h2 className="mt-3 font-display text-[clamp(36px,3.4vw,56px)] leading-none tracking-[-0.03em]">{t("reviews.title")}</h2>
          {summary.count > 0 ? (
            <>
              <div className="mt-8 flex items-end gap-4">
                <p className="font-wordmark text-[clamp(88px,8vw,120px)] leading-[0.8]">{summary.average.toFixed(1)}</p>
                <div className="pb-1">
                  <Stars value={summary.average} size={18} />
                  <p className="mt-1.5 text-[12px] text-ash">
                    {t("reviews.outOf")} · {summary.count === 1 ? t("reviews.basedOne") : t("reviews.based", { count: summary.count })}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((st) => {
                  const n = summary.distribution[st - 1];
                  return (
                    <li key={st} className="flex items-center gap-3 text-[12px]">
                      <span className="w-3 tabular-nums">{st}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 text-right text-ash tabular-nums">{n}</span>
                    </li>
                  );
                })}
              </ul>
              {fitScore !== null && (
                <div className="mt-8">
                  <p className="label mb-3 font-semibold">{t("reviews.fit")}</p>
                  <div className="relative h-1.5 rounded-full bg-black/10">
                    <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow" style={{ left: `${50 + fitScore * 50}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-ash">
                    <span>{t("reviews.small")}</span>
                    <span>{t("reviews.true")}</span>
                    <span>{t("reviews.large")}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-6 text-[14px] text-ash">{t("reviews.none")}</p>
          )}

          <div className="mt-8">
            {canReview ? (
              <details className="group">
                <summary className="btn-solid w-full sm:w-auto">{t("reviews.write")}</summary>
                <div className="mt-4">
                  <ReviewForm productId={productId} sizes={sizes} />
                </div>
              </details>
            ) : alreadyReviewed ? (
              <p className="bg-stone p-4 text-[13px]">{t("reviews.thanks")}</p>
            ) : !signedIn ? (
              <Link href={`/account/login?next=/products/${slug}%23reviews`} className="btn-outline w-full justify-center border-ink py-3.5 text-[11px] hover:bg-ink hover:text-white sm:w-auto">
                {t("reviews.signIn")} {t("reviews.toWrite")}
              </Link>
            ) : null}
          </div>
        </div>

        <ul data-reveal="stagger" className="grid content-start gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} size={14} />
                <span className="text-[11px] text-ash">{fmtDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-4 font-display text-[22px] leading-tight tracking-[-0.01em]">{r.title}</p>}
              <p className="mt-3 flex-1 text-[14px] leading-[1.7] text-black/80">{r.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 text-[11px]">
                <span className="grid size-7 place-items-center rounded-full bg-accent/25 font-semibold text-[#5a44cf] uppercase">{r.name.charAt(0)}</span>
                <span className="font-medium">{r.name}</span>
                {r.verified && (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <BadgeCheck className="size-3.5" /> {t("reviews.verified")}
                  </span>
                )}
                {r.size && <span className="rounded-full bg-stone px-2 py-0.5">{r.size}</span>}
                {r.fit && <span className="rounded-full bg-stone px-2 py-0.5">{t(FIT_KEY[r.fit])}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
