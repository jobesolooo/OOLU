import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getKey } from "@/lib/keys";
import { getBusiness, staffInbox } from "@/lib/business";

/**
 * Incoming mail for the shop's addresses (hello@, orders@, returns@ …).
 * Resend calls this for every email it receives on the email domain; we forward it to
 * the staff inbox from Admin → Settings, with Reply-To set to the customer so a reply
 * from that inbox goes straight back to them.
 */
export const maxDuration = 60;

const MAX_ATTACHMENTS_BYTES = 30 * 1024 * 1024; // Resend's sending limit is 40MB including the body

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: NextRequest) {
  const [key, secret] = await Promise.all([getKey("RESEND_API_KEY"), getKey("RESEND_WEBHOOK_SECRET")]);
  if (!key || !secret) return new NextResponse("Email isn't set up", { status: 503 });
  const resend = new Resend(key);

  // Verify the signature on the raw body (Resend signs with Svix).
  const payload = await req.text();
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return new NextResponse("Missing signature", { status: 400 });
  let event: { type: string; data: { email_id?: string; from?: string; to?: string[]; subject?: string } };
  try {
    event = resend.webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: secret }) as typeof event;
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  if (event.type !== "email.received" || !event.data.email_id) return NextResponse.json({ ignored: event.type });

  const b = await getBusiness();
  const to = await staffInbox();
  if (!to) {
    console.warn("[inbound] no forwarding inbox set; mail stays in Resend → Emails → Receiving");
    return NextResponse.json({ forwarded: false });
  }

  // Resend retries webhooks: handle each email once.
  const db = await getDb();
  const claimed = await db
    .insert(schema.processedEvents)
    .values({ id: `resend:${event.data.email_id}`, type: "email.received" })
    .onConflictDoNothing()
    .returning();
  if (!claimed.length) return NextResponse.json({ duplicate: true });

  try {
    const { data: mail, error } = await resend.emails.receiving.get(event.data.email_id);
    if (error || !mail) throw new Error(error?.message ?? "Couldn't read the email");

    const sender = mail.from; // e.g. "Sam <sam@gmail.com>" or "sam@gmail.com"
    const senderAddress = (sender.match(/<([^>]+)>/)?.[1] ?? sender).trim().toLowerCase();
    // Never forward our own mail back to ourselves (stops loops and bounces).
    if (senderAddress.endsWith(`@${b.emailDomain}`) || senderAddress === to.toLowerCase()) return NextResponse.json({ skipped: "own address" });

    const ours = [...(mail.to ?? []), ...(mail.cc ?? []), ...(mail.received_for ?? [])].find((a) => a.toLowerCase().includes(`@${b.emailDomain}`)) ?? `hello@${b.emailDomain}`;
    const ourAddress = (ours.match(/<([^>]+)>/)?.[1] ?? ours).toLowerCase();
    const senderName = (sender.match(/^\s*"?([^"<]+?)"?\s*</)?.[1] ?? senderAddress).replace(/[<>"]/g, "");

    // Attachments: download each one (links expire), within the size limit.
    const attachments: { filename: string; content: string }[] = [];
    let skipped = 0;
    if (mail.attachments?.length) {
      const { data: list } = await resend.emails.receiving.attachments.list({ emailId: mail.id });
      let total = 0;
      for (const a of list?.data ?? []) {
        if (total + (a.size ?? 0) > MAX_ATTACHMENTS_BYTES) {
          skipped++;
          continue;
        }
        const res = await fetch(a.download_url);
        if (!res.ok) {
          skipped++;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        total += buf.length;
        attachments.push({ filename: a.filename ?? "attachment", content: buf.toString("base64") });
      }
    }

    const banner = `<div style="font-family:Menlo,Consolas,monospace;font-size:12px;color:#555;border-bottom:1px solid #ddd;padding:0 0 10px;margin:0 0 16px">
Sent to <strong>${esc(ourAddress)}</strong> by ${esc(sender)}. Press reply to answer them directly.${skipped ? ` <br>${skipped} attachment(s) were too large to forward. Open them in Resend → Emails → Receiving.` : ""}</div>`;
    const replyTo = mail.reply_to?.length ? mail.reply_to : [sender];

    const { error: sendError } = await resend.emails.send({
      from: `${senderName} via ${b.name} <inbox@${b.emailDomain}>`,
      to,
      replyTo,
      subject: `[${ourAddress.split("@")[0]}@] ${mail.subject || "(no subject)"}`,
      html: banner + (mail.html ?? `<pre style="white-space:pre-wrap;font-family:inherit">${esc(mail.text ?? "")}</pre>`),
      text: `Sent to ${ourAddress} by ${sender}. Reply to answer them directly.\n\n${mail.text ?? ""}`,
      attachments,
      headers: mail.message_id ? { "X-Original-Message-ID": mail.message_id } : undefined,
    });
    if (sendError) throw new Error(sendError.message);
    return NextResponse.json({ forwarded: true });
  } catch (err) {
    // Let Resend retry later.
    await db.delete(schema.processedEvents).where(eq(schema.processedEvents.id, `resend:${event.data.email_id}`));
    console.error("[inbound] forward failed", err);
    return new NextResponse("Forward failed", { status: 500 });
  }
}

