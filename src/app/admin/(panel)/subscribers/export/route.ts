import { desc, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

const csv = (v: unknown) => {
  const s = String(v ?? "");
  // Quote, and neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const unsub = new URL(req.url).searchParams.get("view") === "unsubscribed";
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("Forbidden", { status: 403 });
  const db = await getDb();
  const rows = await db.select().from(schema.subscribers).where(unsub ? isNotNull(schema.subscribers.unsubscribedAt) : isNull(schema.subscribers.unsubscribedAt)).orderBy(desc(schema.subscribers.createdAt));
  const body = ["email,source,welcome_code,joined", ...rows.map((r) => [r.email, r.source, r.promoCode, r.createdAt.toISOString()].map(csv).join(","))].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${unsub ? "unsubscribed" : "subscribers"}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
