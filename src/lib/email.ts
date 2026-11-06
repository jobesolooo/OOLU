import "server-only";
import { Resend } from "resend";
import { site } from "./site";
import { formatMoney } from "./format";
import { variantLabel } from "./variants";
import type { Order, OrderItem, ShippingAddress } from "./db/schema";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

export async function sendEmail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev mode: print the email (and any links in it) to the terminal instead of sending.
    const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((l) => !l.startsWith("mailto:"));
    console.info(`[email:dev] To: ${mail.to} | ${mail.subject}${links.length ? `\n  ${links.join("\n  ")}` : ""}`);
    return { skipped: true as const };
  }
  const from = process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, ...mail });
    if (error) console.error("[email] send failed", error);
  } catch (err) {
    // Never let an email failure break checkout or the webhook.
    console.error("[email] send failed", err);
  }
  return { skipped: false as const };
}

const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function layout(title: string, body: string) {
  const base = siteUrl().replace(/\/$/, "");
  // Images only load from a public https URL, so locally the header falls back to the wordmark.
  const mark = base.startsWith("https://")
    ? `<img src="${base}/images/brand/logo-mark.png" width="40" height="38" alt="" style="vertical-align:middle;margin-right:14px;border:0">`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f3f2ef;font-family:'Roboto Mono',Menlo,Consolas,monospace;color:#060606">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:560px;background:#fdfdfd" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:28px 32px;border-bottom:1px solid #eeedeb">${mark}<span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:34px;letter-spacing:2px;vertical-align:middle">${esc(site.wordmark)}</span></td></tr>
<tr><td style="padding:32px;font-size:13px;line-height:1.6">
<h1 style="margin:0 0 16px;font-family:Newsreader,Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;letter-spacing:-0.5px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;background:#060606;color:#fdfdfd;font-size:11px;letter-spacing:1px;text-transform:uppercase"><span style="color:#a592ff">${esc(site.name)} · ${esc(site.established)}</span><br>${esc(site.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}${
        i.size && i.size !== "One Size" ? ` <span style="color:#777">· ${esc(variantLabel(i.size))}</span>` : ""
      } × ${i.quantity}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${formatMoney(
        i.unitAmount * i.quantity,
        order.currency,
      )}</td></tr>`,
    )
    .join("");
  const line = (label: string, cents: number, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold" : "color:#555"}">${label}</td><td align="right" style="padding:4px 0;${
      bold ? "font-weight:bold" : ""
    }">${formatMoney(cents, order.currency)}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
${line("Subtotal", order.subtotal)}${line("Shipping", order.shipping)}${order.tax ? line("Tax", order.tax) : ""}${line(
    "Total",
    order.total,
    true,
  )}</table>`;
}

function address(a: ShippingAddress | null) {
  if (!a) return "";
  const parts = [a.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country]
    .filter(Boolean)
    .map(esc);
  return `<p style="font-size:14px;line-height:1.6;color:#333"><strong>Shipping to</strong><br>${parts.join("<br>")}</p>`;
}

export async function sendOrderConfirmation(order: Order, items: OrderItem[]) {
  if (!order.email) return;
  await sendEmail({
    to: order.email,
    subject: `Order #${order.number} confirmed — ${site.name}`,
    html: layout(
      "Thanks for your order",
      `<p style="font-size:14px;line-height:1.6">We've got your order <strong>#${order.number}</strong> and we're getting it ready. You'll get another email when it ships.</p>
${itemsTable(order, items)}${address(order.shippingAddress)}
<p><a href="${siteUrl()}/account" style="display:inline-block;background:#060606;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">View your account</a></p>`,
    ),
  });
}

export async function sendAdminNewOrder(order: Order, items: OrderItem[]) {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    subject: `New order #${order.number} — ${formatMoney(order.total, order.currency)}`,
    html: layout(
      `New order #${order.number}`,
      `<p style="font-size:14px">From ${esc(order.email)}</p>${itemsTable(order, items)}${address(order.shippingAddress)}
<p><a href="${siteUrl()}/admin/orders/${order.id}">Open in admin</a></p>`,
    ),
  });
}

export async function sendShippingUpdate(order: Order) {
  if (!order.email) return;
  const tracking = order.trackingNumber
    ? `<p style="font-size:14px">Tracking: <strong>${esc(order.trackingCarrier)} ${esc(order.trackingNumber)}</strong></p>`
    : "";
  await sendEmail({
    to: order.email,
    subject: `Order #${order.number} has shipped`,
    html: layout("Your order is on the way", `<p style="font-size:14px;line-height:1.6">Good news — order <strong>#${order.number}</strong> just left us.</p>${tracking}`),
  });
}

export async function sendRefundNotice(order: Order, amount: number) {
  if (!order.email) return;
  await sendEmail({
    to: order.email,
    subject: `Refund for order #${order.number}`,
    html: layout(
      "Refund issued",
      `<p style="font-size:14px;line-height:1.6">We've refunded <strong>${formatMoney(amount, order.currency)}</strong> for order #${order.number}. It can take 5–10 business days to show up on your statement.</p>`,
    ),
  });
}

export async function sendWelcome(email: string, name?: string | null) {
  await sendEmail({
    to: email,
    subject: `Welcome to ${site.name}`,
    html: layout(
      `Welcome${name ? `, ${name}` : ""}`,
      `<p style="font-size:14px;line-height:1.6">Your account is set up. Track orders and check out faster next time.</p>
<p><a href="${siteUrl()}/shop" style="display:inline-block;background:#060606;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">Shop now</a></p>`,
    ),
  });
}

const button = (href: string, label: string) =>
  `<p style="margin-top:24px"><a href="${href}" style="display:inline-block;background:#060606;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</a></p>`;

export async function sendNewsletterWelcome(email: string, code: string | null, percentOff: number) {
  await sendEmail({
    to: email,
    subject: code ? `Your ${percentOff}% off code — ${site.name}` : `You're on the list — ${site.name}`,
    html: layout(
      "You're in.",
      `<p style="font-size:14px;line-height:1.6">First access to drops, restocks and stories from Amsterdam.</p>${
        code
          ? `<p style="font-size:14px;line-height:1.6">Here's ${percentOff}% off your first order:</p>
<p style="font-size:24px;letter-spacing:4px;font-weight:bold;border:1px dashed #111;padding:14px;text-align:center">${esc(code)}</p>
<p style="font-size:12px;color:#777">One use, first order only. Enter it at checkout.</p>`
          : ""
      }${button(`${siteUrl()}/shop`, "Shop now")}`,
    ),
  });
}

export async function sendStockAlert(email: string, productName: string, size: string, slug: string, launch = false) {
  await sendEmail({
    to: email,
    subject: launch ? `${productName} just dropped` : `Back in stock: ${productName}${size ? ` (${size})` : ""}`,
    html: layout(
      launch ? "It's live." : "It's back.",
      `<p style="font-size:14px;line-height:1.6"><strong>${esc(productName)}</strong>${
        size ? ` in size ${esc(size)}` : ""
      } is available now. Stock is limited — first come, first served.</p>${button(`${siteUrl()}/products/${slug}`, "Shop now")}`,
    ),
  });
}

export async function sendGiftCardEmail(card: {
  code: string;
  initialAmount: number;
  currency: string;
  recipientEmail: string | null;
  recipientName: string | null;
  senderName: string | null;
  message: string | null;
  purchaserEmail: string | null;
}) {
  const to = card.recipientEmail || card.purchaserEmail;
  if (!to) return;
  const from = card.senderName ? `${esc(card.senderName)} sent you` : "You've got";
  await sendEmail({
    to,
    subject: `${card.senderName ? `${card.senderName} sent you` : "Your"} a ${site.name} gift card`,
    html: layout(
      `${formatMoney(card.initialAmount, card.currency)} gift card`,
      `<p style="font-size:14px;line-height:1.6">${card.recipientName ? `${esc(card.recipientName)}, ` : ""}${from} a ${site.name} gift card.</p>
${card.message ? `<p style="font-size:14px;line-height:1.6;font-style:italic;border-left:3px solid #111;padding-left:12px">“${esc(card.message)}”</p>` : ""}
<p style="font-size:22px;letter-spacing:3px;font-weight:bold;border:1px dashed #111;padding:14px;text-align:center">${esc(card.code)}</p>
<p style="font-size:12px;color:#777">Enter the code in your bag before checkout. Any remaining balance stays on the card.</p>
${button(`${siteUrl()}/shop`, "Start shopping")}`,
    ),
  });
  if (card.recipientEmail && card.purchaserEmail && card.recipientEmail !== card.purchaserEmail) {
    await sendEmail({
      to: card.purchaserEmail,
      subject: `Your gift card was sent`,
      html: layout(
        "Gift card sent",
        `<p style="font-size:14px;line-height:1.6">We emailed a ${formatMoney(card.initialAmount, card.currency)} gift card to ${esc(
          card.recipientEmail,
        )}.</p>`,
      ),
    });
  }
}

const RETURN_COPY: Record<string, { subject: string; title: string; body: string }> = {
  requested: {
    subject: "We got your return request",
    title: "Return requested",
    body: "We'll review it within 1–2 business days and email you the next steps.",
  },
  approved: {
    subject: "Your return is approved",
    title: "Return approved",
    body: "Pack the items with your order number inside and send them back to the address below. We'll refund you as soon as they arrive.",
  },
  received: { subject: "We received your return", title: "Return received", body: "We're checking the items and will process your refund shortly." },
  refunded: {
    subject: "Your refund is on its way",
    title: "Refund issued",
    body: "Your refund has been issued. It can take 5–10 business days to show up on your statement.",
  },
  rejected: {
    subject: "About your return request",
    title: "Return not accepted",
    body: "Unfortunately we can't accept this return. Reply to this email if you have any questions.",
  },
};

export async function sendReturnUpdate(email: string | null, orderNumber: number, status: string, note?: string | null) {
  const copy = RETURN_COPY[status];
  if (!email || !copy) return;
  const address = process.env.RETURN_ADDRESS;
  await sendEmail({
    to: email,
    subject: `${copy.subject} (order #${orderNumber})`,
    html: layout(
      copy.title,
      `<p style="font-size:14px;line-height:1.6">${copy.body}</p>${
        note ? `<p style="font-size:14px;line-height:1.6">${esc(note)}</p>` : ""
      }${
        status === "approved" && address
          ? `<p style="font-size:14px;line-height:1.6"><strong>Return address</strong><br>${esc(address).replace(/\|/g, "<br>")}</p>`
          : ""
      }`,
    ),
  });
}

export async function sendContactNotification(msg: { name: string; email: string; topic: string; orderNumber: string | null; message: string }) {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    subject: `[${msg.topic}] Message from ${msg.name}`,
    html: layout(
      "New message",
      `<p style="font-size:14px">From <strong>${esc(msg.name)}</strong> &lt;${esc(msg.email)}&gt;${
        msg.orderNumber ? ` · Order #${esc(msg.orderNumber)}` : ""
      }</p><p style="font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(msg.message)}</p>${button(
        `${siteUrl()}/admin/messages`,
        "Open inbox",
      )}`,
    ),
    replyTo: msg.email,
  });
}

export async function sendVerifyEmail(email: string, token: string) {
  await sendEmail({
    to: email,
    subject: `Confirm your email — ${site.name}`,
    html: layout(
      "Confirm your email",
      `<p style="font-size:14px;line-height:1.6">Tap the button to confirm this is your email. It also connects any orders you placed as a guest to your account.</p>${button(
        `${siteUrl()}/account/verify?token=${encodeURIComponent(token)}`,
        "Confirm email",
      )}<p style="font-size:12px;color:#777">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
    ),
  });
}

export async function sendPasswordReset(email: string, token: string) {
  await sendEmail({
    to: email,
    subject: `Reset your password — ${site.name}`,
    html: layout(
      "Reset your password",
      `<p style="font-size:14px;line-height:1.6">Someone (hopefully you) asked to reset the password for this account.</p>${button(
        `${siteUrl()}/account/reset?token=${encodeURIComponent(token)}`,
        "Choose a new password",
      )}<p style="font-size:12px;color:#777">This link expires in 1 hour and can be used once. If you didn't ask for this, you can ignore this email — your password won't change.</p>`,
    ),
  });
}

/** Staff created an account for this person: invite them to choose a password. */
export async function sendAccountInvite(email: string, name: string | null, token: string) {
  await sendEmail({
    to: email,
    subject: `Your ${site.name} account is ready`,
    html: layout(
      name ? `Welcome, ${name}` : "Your account is ready",
      `<p style="font-size:14px;line-height:1.6">We've set up a ${site.name} account for you, so you can track orders, save favourites and check out faster. Choose a password to start using it.</p>${button(
        `${siteUrl()}/account/reset?token=${encodeURIComponent(token)}`,
        "Choose a password",
      )}<p style="font-size:12px;color:#777">This link works for 7 days. You can also sign in with Google or Apple using this email.</p>`,
    ),
  });
}

export async function sendSecurityNotice(email: string, what: string) {
  await sendEmail({
    to: email,
    subject: `Security update on your ${site.name} account`,
    html: layout(
      "Account change",
      `<p style="font-size:14px;line-height:1.6">${esc(what)}</p><p style="font-size:12px;color:#777">If this wasn't you, reset your password right away and contact us.</p>${button(
        `${siteUrl()}/account/forgot`,
        "Reset password",
      )}`,
    ),
  });
}

export async function sendAdminCode(email: string, code: string, ttlMinutes: number) {
  await sendEmail({
    to: email,
    subject: `${code} is your ${site.name} admin code`,
    html: layout(
      "Admin sign-in",
      `<p style="font-size:14px;line-height:1.6">Use this code to open the ${esc(site.name)} admin. It expires in ${ttlMinutes} minutes.</p>
<p style="font-size:36px;letter-spacing:12px;font-weight:bold;text-align:center;border:1px solid #111;padding:18px;font-family:Menlo,Consolas,monospace">${esc(code)}</p>
<p style="font-size:12px;color:#777">Didn't try to sign in? Someone may know your email — you can ignore this, the code is useless without access to your inbox.</p>`,
    ),
  });
  // Dev convenience: show the code itself in the terminal (emails are only logged when Resend isn't set up).
  if (!process.env.RESEND_API_KEY) console.info(`[email:dev] admin code for ${email}: ${code}`);
}
