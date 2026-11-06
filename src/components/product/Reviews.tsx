import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/db/schema";
import type { ReviewSummary } from "@/lib/reviews";
import { formatDate } from "@/lib/format";
import { Stars } from "../Price";
import { ReviewForm } from "./ReviewForm";

const FIT_LABEL = { small: "Runs small", true: "True to size", large: "Runs large" } as const;

export function Reviews({
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
  const fits = reviews.filter((r) => r.fit);
  const fitScore = fits.length ? fits.reduce((s, r) => s + (r.fit === "small" ? -1 : r.fit === "large" ? 1 : 0), 0) / fits.length : null;

  return (
    <section id="reviews" className="section-y scroll-mt-24 border-t border-black/10">
      <div className="container-x grid gap-12 lg:grid-cols-[360px_1fr]">
        <div>
          <h2 className="eyebrow">Reviews</h2>
          {summary.count > 0 ? (
            <>
              <p className="mt-4 font-display text-6xl font-[800]">{summary.average.toFixed(1)}</p>
              <Stars value={summary.average} size={20} className="mt-2" />
              <p className="mt-2 text-sm text-ash">
                Based on {summary.count} review{summary.count === 1 ? "" : "s"}
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
                  <p className="label mb-2 font-semibold">Fit</p>
                  <div className="relative h-1.5 bg-black/10">
                    <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${50 + fitScore * 50}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-ash">
                    <span>Runs small</span>
                    <span>True to size</span>
                    <span>Runs large</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-ash">No reviews yet. Be the first.</p>
          )}
        </div>

        <div className="space-y-10">
          {canReview ? (
            <details className="group">
              <summary className="btn-solid">Write a review</summary>
              <div className="mt-4">
                <ReviewForm productId={productId} sizes={sizes} />
              </div>
            </details>
          ) : alreadyReviewed ? (
            <p className="text-sm text-ash">Thanks — you&apos;ve reviewed this product.</p>
          ) : !signedIn ? (
            <p className="text-sm">
              <Link href={`/account/login?next=/products/${slug}%23reviews`} className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to write a review.
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
                      <BadgeCheck className="size-3.5" /> Verified buyer
                    </span>
                  )}
                  {r.size && <span>Size {r.size}</span>}
                  {r.fit && <span>{FIT_LABEL[r.fit]}</span>}
                  <span>{formatDate(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
