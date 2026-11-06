import { desc, eq } from "drizzle-orm";
import { AdminEmpty } from "../Empty";
import { MessageSquareText } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/Price";
import { moderateReview } from "../actions";
import { AdminHeader, Segmented } from "../ui";

export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/reviews">) {
  const raw = (await searchParams).status;
  const status = (["pending", "approved", "rejected"] as const).find((s) => s === raw) ?? "approved";
  const db = await getDb();
  const [rows, products] = await Promise.all([
    db.select().from(schema.reviews).where(eq(schema.reviews.status, status)).orderBy(desc(schema.reviews.createdAt)).limit(200),
    getProducts(),
  ]);
  const names = new Map(products.map((p) => [p.id, p.name]));

  return (
    <>
      <AdminHeader
        eyebrow="People"
        title="Reviews"
        description="Reviews go live as soon as they're written. Hide one to take it off the product page, or delete it for good."
        actions={
          <Segmented
            items={(["approved", "pending", "rejected"] as const).map((s) => ({
              href: `/admin/reviews?status=${s}`,
              label: s === "approved" ? "Live" : s === "rejected" ? "Hidden" : "Waiting",
              active: s === status,
            }))}
          />
        }
      />
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-2">
        {rows.length === 0 && (
          <li className="bg-white ring-1 ring-black/5 xl:col-span-2">
            <AdminEmpty
              icon={MessageSquareText}
              title={status === "pending" ? "Nothing waiting" : status === "approved" ? "No reviews yet" : "No hidden reviews"}
              body={status === "pending" ? "Reviews now publish straight away. Older reviews that were waiting show here and are already visible on the product page; reject one to hide it." : undefined}
            />
          </li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-4 bg-white p-5 ring-1 ring-black/5 sm:p-6">
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
                  <button className={`border px-3 py-2 text-[11px] tracking-[0.1em] uppercase transition-colors ${a === "approve" ? "border-ink bg-ink text-white" : a === "delete" ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-black/20 hover:border-ink"}`}>{a === "reject" ? "hide" : a === "approve" ? (status === "rejected" ? "show" : "approve") : a}</button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
