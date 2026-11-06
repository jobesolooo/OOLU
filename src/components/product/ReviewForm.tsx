"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewState } from "@/app/products/[slug]/actions";
import { cx } from "@/lib/format";

export function ReviewForm({ productId, sizes }: { productId: string; sizes: string[] }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state?.ok) return <p className="bg-white p-6 text-sm">{state.ok}</p>;

  return (
    <form action={action} className="space-y-4 bg-white p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <p className="label mb-2 font-semibold">Your rating</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-pressed={rating === i}
              onMouseEnter={() => setHover(i)}
              onClick={() => setRating(i)}
            >
              <Star className={cx("size-7", (hover || rating) >= i ? "fill-ink text-ink" : "text-black/25")} strokeWidth={1.3} />
            </button>
          ))}
        </div>
      </div>
      <input name="title" placeholder="Headline (optional)" maxLength={120} className="input" />
      <textarea name="body" required minLength={10} rows={4} placeholder="How's the quality, fit, feel?" className="input" />
      <div className="grid gap-3 sm:grid-cols-2">
        {sizes.length > 1 && (
          <select name="size" className="input" defaultValue="">
            <option value="">Size you bought (optional)</option>
            {sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        <select name="fit" className="input" defaultValue="">
          <option value="">How does it fit? (optional)</option>
          <option value="small">Runs small</option>
          <option value="true">True to size</option>
          <option value="large">Runs large</option>
        </select>
      </div>
      {state?.error && <p className="text-[13px] text-red-700">{state.error}</p>}
      <button className="btn-solid" disabled={pending}>{pending ? "Sending…" : "Submit review"}</button>
    </form>
  );
}
