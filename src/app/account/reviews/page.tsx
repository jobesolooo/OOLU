import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listUserReviews } from "@/lib/account";
import { getProducts } from "@/lib/catalog";
import { cx } from "@/lib/format";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { ConfirmSubmit } from "@/components/account/ConfirmSubmit";
import { ReviewForm } from "../forms";
import { deleteMyReview } from "../manage";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.reviews"), robots: { index: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function MyReviewsPage({ searchParams }: PageProps<"/account/reviews">) {
  const user = await requireUser("/account/reviews");
  const sp = await searchParams;
  const { t, locale } = await getT();
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(d);
  const [reviews, products] = await Promise.all([listUserReviews(user.id), getProducts()]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const editId = one(sp.edit);
  const editing = editId ? reviews.find((r) => r.id === editId) : undefined;
  if (editId && !editing) notFound();
  const saved = one(sp.saved);
  const btn = "text-[11px] tracking-[0.08em] uppercase underline-offset-4 hover:underline";

  return (
    <AccountShell user={user} active="reviews" title={t("ac.nav.reviews")} notice={saved ? t(`ac.rev.${saved}` as MessageKey) : null}>
      {editing && (
        <AccountSection n={1} id="form" title={t("ac.editReview")} sub={byId.get(editing.productId)?.name}>
          <AccountCard>
            <ReviewForm review={editing} />
          </AccountCard>
        </AccountSection>
      )}
      <AccountSection n={editing ? 2 : 1} title={t("ac.yourReviews")} sub={t("ac.reviewsSub")}>
        {reviews.length === 0 ? (
          <AccountCard className="text-center">
            <p className="text-[14px] text-ash">{t("ac.noReviews")}</p>
            <Link href="/account/orders" className="btn-solid mt-6">
              {t("ac.nav.orders")}
            </Link>
          </AccountCard>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => {
              const p = byId.get(r.productId);
              const hidden = r.status === "rejected";
              return (
                <li key={r.id} className={cx("grid grid-cols-[72px_minmax(0,1fr)] gap-5 bg-white p-5 ring-1 ring-black/5 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-6", editing?.id === r.id && "ring-2 ring-accent")}>
                  <Link href={p ? `/products/${p.slug}` : "#"} className="relative aspect-[4/5] overflow-hidden bg-stone">
                    {p?.images[0] && <Image src={p.images[0]} alt={p.name} fill sizes="96px" className="object-cover" />}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex" aria-label={`${r.rating}/5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cx("size-4", n <= r.rating ? "fill-ink text-ink" : "text-black/20")} strokeWidth={1.3} />
                        ))}
                      </span>
                      <span className={cx("rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.08em] uppercase", hidden ? "bg-black/5 text-ash" : "bg-emerald-50 text-emerald-700")}>
                        {hidden ? t("ac.reviewHidden") : t("ac.reviewLive")}
                      </span>
                      {r.verified && <span className="text-[11px] text-ash">{t("ac.verifiedBuyer")}</span>}
                    </div>
                    <p className="mt-2 text-[12px] tracking-[0.04em] text-ash uppercase">
                      {p?.name ?? t("ac.removedProduct")} · {fmtDate(r.createdAt)}
                    </p>
                    {r.title && <p className="mt-2 font-display text-[20px] leading-snug tracking-[-0.01em]">{r.title}</p>}
                    <p className="mt-1 line-clamp-4 text-[14px] leading-[1.7] text-black/75">{r.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/10 pt-4">
                      <Link href={`/account/reviews?edit=${r.id}#form`} className={btn}>
                        {t("ac.edit")}
                      </Link>
                      {p && (
                        <Link href={`/products/${p.slug}#reviews`} className={btn}>
                          {t("ac.viewOnProduct")}
                        </Link>
                      )}
                      <form action={deleteMyReview} className="ml-auto">
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmit message={t("ac.deleteReviewQ")} className={`${btn} text-rose-700`}>
                          {t("ac.delete")}
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AccountSection>
    </AccountShell>
  );
}
