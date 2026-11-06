import { desc, eq } from "drizzle-orm";
import { AdminEmpty } from "../Empty";
import { Inbox } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { setMessageStatus } from "../actions";

export default async function MessagesAdmin({ searchParams }: PageProps<"/admin/messages">) {
  const raw = (await searchParams).status;
  const status = raw === "done" ? "done" : "new";
  const db = await getDb();
  const rows = await db.select().from(schema.contactMessages).where(eq(schema.contactMessages.status, status)).orderBy(desc(schema.contactMessages.createdAt)).limit(200);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-[900] uppercase">Inbox</h1>
        <div className="flex gap-2">
          {(["new", "done"] as const).map((s) => (
            <a key={s} href={`/admin/messages?status=${s}`} className={`border px-4 py-2 text-[11px] tracking-[0.12em] uppercase ${s === status ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}>
              {s === "new" ? "Open" : "Done"}
            </a>
          ))}
        </div>
      </div>
      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="bg-white">
            <AdminEmpty
              icon={Inbox}
              title={status === "new" ? "Inbox zero" : "Nothing marked done"}
              body="Messages from the contact form arrive here (and by email if ORDER_NOTIFICATION_EMAIL is set)."
              action={{ label: "View contact page", href: "/help/contact" }}
            />
          </li>
        )}
        {rows.map((m) => (
          <li key={m.id} className="bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{m.topic}{m.orderNumber ? ` · Order #${m.orderNumber}` : ""}</p>
                <p className="text-xs text-ash">{m.name} · {m.email} · {formatDate(m.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`} className="btn-solid px-4 py-2.5">Reply</a>
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={m.status === "new" ? "done" : "new"} />
                  <button className="border border-black/20 px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase">{m.status === "new" ? "Mark done" : "Reopen"}</button>
                </form>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
