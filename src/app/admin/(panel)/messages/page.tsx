import { desc, eq } from "drizzle-orm";
import { AdminEmpty } from "../Empty";
import { Inbox } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { setMessageStatus } from "../actions";
import { AdminHeader, Segmented } from "../ui";

export default async function MessagesAdmin({ searchParams }: PageProps<"/admin/messages">) {
  const raw = (await searchParams).status;
  const status = raw === "done" ? "done" : "new";
  const db = await getDb();
  const rows = await db.select().from(schema.contactMessages).where(eq(schema.contactMessages.status, status)).orderBy(desc(schema.contactMessages.createdAt)).limit(200);
  return (
    <>
      <AdminHeader
        eyebrow="People"
        title="Inbox"
        description="Messages from the contact form. Reply opens your email app with the subject filled in."
        actions={<Segmented items={(["new", "done"] as const).map((s) => ({ href: `/admin/messages?status=${s}`, label: s === "new" ? "Open" : "Done", active: s === status }))} />}
      />
      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="bg-white ring-1 ring-black/5">
            <AdminEmpty
              icon={Inbox}
              title={status === "new" ? "Inbox zero" : "Nothing marked done"}
              body="Messages from the contact form arrive here (and by email if ORDER_NOTIFICATION_EMAIL is set)."
              action={{ label: "View contact page", href: "/help/contact" }}
            />
          </li>
        )}
        {rows.map((m) => (
          <li key={m.id} className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-[22px] tracking-[-0.01em]">{m.topic}{m.orderNumber ? ` · Order #${m.orderNumber}` : ""}</p>
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
            <p className="mt-4 border-l-2 border-accent pl-4 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
