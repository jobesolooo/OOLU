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
    <section id="reviews" className="section-y scroll-mt-24 border-t border-black/10">
      <div className="container-x grid gap-12 lg:grid-cols-[360px_1fr]">
        <div>
          <h2 className="eyebrow">{t("reviews.title")}</h2>
          {summary.count > 0 ? (
            <>
              <p className="mt-4 font-display font-normal tracking-[-0.02em] text-6xl">{summary.average.toFixed(1)}</p>
              <Stars value={summary.average} size={20} className="mt-2" />
              <p className="mt-2 text-sm text-ash">
                {summary.count === 1 ? t("reviews.basedOne") : t("reviews.based", { count: summary.count })}
              </p>
              <ul className="mt-6 space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const n = summary.distribution[s - 1];
                  return (
                    <li key={s} className="flex items-center gap-3 text-xs">
                      <span className="w-3">{s}</span>
                      <span className="h-1.5 flex-1 bg-black/10">
                        <span className="block h-full bg-ink" style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 text-right text-ash">{n}</span>
                    </li>
                  );
                })}
              </ul>
              {fitScore !== null && (
                <div className="mt-8">
                  <p className="label mb-2 font-semibold">{t("reviews.fit")}</p>
                  <div className="relative h-1.5 bg-black/10">
                    <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${50 + fitScore * 50}%` }} />
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
            <p className="mt-4 text-sm text-ash">{t("reviews.none")}</p>
          )}
        </div>

        <div className="space-y-10">
          {canReview ? (
            <details className="group">
              <summary className="btn-solid">{t("reviews.write")}</summary>
              <div className="mt-4">
                <ReviewForm productId={productId} sizes={sizes} />
              </div>
            </details>
          ) : alreadyReviewed ? (
            <p className="text-sm text-ash">{t("reviews.thanks")}</p>
          ) : !signedIn ? (
            <p className="text-sm">
              <Link href={`/account/login?next=/products/${slug}%23reviews`} className="underline underline-offset-4">
                {t("reviews.signIn")}
              </Link>{" "}
              {t("reviews.toWrite")}
            </p>
          ) : null}

          <ul className="divide-y divide-black/10">
            {reviews.map((r) => (
              <li key={r.id} className="py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} size={14} />
                  {r.title && <p className="font-semibold">{r.title}</p>}
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-black/80">{r.body}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ash">
                  <span className="font-medium text-ink">{r.name}</span>
                  {r.verified && (
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="size-3.5" /> {t("reviews.verified")}
                    </span>
                  )}
                  {r.size && <span>{r.size}</span>}
                  {r.fit && <span>{t(FIT_KEY[r.fit])}</span>}
                  <span>{fmtDate(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
