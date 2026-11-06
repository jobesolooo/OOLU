import { desc, eq } from "drizzle-orm";
import { AdminEmpty } from "../Empty";
import { MessageSquareText } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/Price";
import { moderateReview } from "../actions";

export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/reviews">) {
  const raw = (await searchParams).status;
  const status = (["pending", "approved", "rejected"] as const).find((s) => s === raw) ?? "pending";
  const db = await getDb();
  const [rows, products] = await Promise.all([
    db.select().from(schema.reviews).where(eq(schema.reviews.status, status)).orderBy(desc(schema.reviews.createdAt)).limit(200),
    getProducts(),
  ]);
  const names = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-[900] uppercase">Reviews</h1>
          <p className="mt-1 text-xs text-ash">Reviews from verified buyers publish automatically. Others wait here for approval.</p>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <a key={s} href={`/admin/reviews?status=${s}`} className={`border px-4 py-2 text-[11px] tracking-[0.12em] uppercase ${s === status ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}>
              {s}
            </a>
          ))}
        </div>
      </div>
      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="bg-white">
            <AdminEmpty
              icon={MessageSquareText}
              title={status === "pending" ? "Nothing to review" : `No ${status} reviews`}
              body={status === "pending" ? "Reviews from shoppers who haven't bought the item wait here for your approval. Verified buyers publish automatically." : undefined}
            />
          </li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-4 bg-white p-5 md:flex-row md:items-start">
            <div className="flex-1">
              <p className="text-xs text-ash">{names.get(r.productId) ?? r.productId} · {formatDate(r.createdAt)} · {r.name}{r.verified ? " · verified buyer" : ""}</p>
              <div className="mt-2 flex items-center gap-3">
                <Stars value={r.rating} size={14} />
                {r.title && <p className="font-semibold">{r.title}</p>}
              </div>
              <p className="mt-2 text-sm leading-relaxed">{r.body}</p>
            </div>
            <div className="flex gap-2">
              {(status === "approved" ? ["reject", "delete"] : status === "rejected" ? ["approve", "delete"] : ["approve", "reject"]).map((a) => (
                <form key={a} action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value={a} />
                  <button className={`border px-3 py-2 text-[11px] tracking-[0.1em] uppercase ${a === "approve" ? "border-ink bg-ink text-white" : "border-black/20"}`}>{a}</button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
