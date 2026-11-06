import "server-only";
import { Resend } from "resend";
import { site } from "./site";
import { formatMoney } from "./format";
import type { Order, OrderItem, ShippingAddress } from "./db/schema";

type Mail = { to: string; subject: string; html: string };

export async function sendEmail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] To: ${mail.to} | ${mail.subject}`);
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
  return `<!doctype html><html><body style="margin:0;background:#f1f0ec;font-family:Helvetica,Arial,sans-serif;color:#111">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:560px;background:#fff" cellpadding="0" cellspacing="0">
<tr><td style="background:#0b0b0b;padding:24px 32px;color:#fff;font-family:Georgia,serif;font-size:28px">W
<span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:6px;margin-left:16px;vertical-align:middle">${esc(site.wordmark)}</span></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;letter-spacing:1px;text-transform:uppercase">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;background:#0b0b0b;color:#bbb;font-size:11px;letter-spacing:3px;text-transform:uppercase">${esc(site.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}${
        i.size && i.size !== "One Size" ? ` <span style="color:#777">· ${esc(i.size)}</span>` : ""
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
<p><a href="${siteUrl()}/account" style="display:inline-block;background:#0b0b0b;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">View your account</a></p>`,
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
<p><a href="${siteUrl()}/shop" style="display:inline-block;background:#0b0b0b;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">Shop now</a></p>`,
    ),
  });
}
