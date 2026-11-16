import "server-only";
import { Resend } from "resend";
import { formatMoney } from "./format";
import { variantLabel } from "./variants";
import type { Order, OrderItem, ShippingAddress } from "./db/schema";
import { siteUrl } from "@/lib/site-url";
import { getKey } from "./keys";
import { biz, getBusiness, staffInbox } from "./business";
import type { Mailbox } from "./mailboxes";
import { accountHtml, esc, giftCardHtml, giftSentHtml, layout, newsletterHtml, orderConfirmedHtml, refundHtml, returnHtml, shippedHtml, stockHtml, welcomeHtml } from "./email-design";
import { trackingUrl } from "./tracking";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { getProductBySlug } from "./catalog";

/** box = which of the shop's addresses it comes from (see mailboxes.ts). */
type Mail = { to: string; subject: string; html: string; replyTo?: string | string[]; text?: string; box?: Mailbox; fromName?: string; attachments?: { filename: string; content: string }[] };

export async function sendEmail(mail: Mail) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const key = await getKey("RESEND_API_KEY");
  if (!key) {
    // Dev mode: print the email (and any links in it) to the terminal instead of sending.
    const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((l) => !l.startsWith("mailto:"));
    console.info(`[email:dev] To: ${mail.to} | ${mail.subject}${links.length ? `\n  ${links.join("\n  ")}` : ""}`);
    return { skipped: true as const };
  }
  const b = biz();
  const { box = "hello", fromName, ...rest } = mail;
  // e.g. "OOLU <orders@ooluclothing.com>". The domain must be verified in Resend.
  const from = `${(fromName ?? b.name).replace(/[<>"]/g, "")} <${box}@${b.emailDomain}>`;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, ...rest });
    if (error) console.error("[email] send failed", error);
  } catch (err) {
    // Never let an email failure break checkout or the webhook.
    console.error("[email] send failed", err);
  }
  return { skipped: false as const };
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

function addressHtml(a: ShippingAddress | null) {
  if (!a) return null;
  return [a.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country].filter(Boolean).map(esc).join("<br>");
}

async function orderItems(orderId: string) {
  const db = await getDb();
  return db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
}

export async function sendOrderConfirmation(order: Order, items: OrderItem[]) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  if (!order.email) return;
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Order #${order.number} confirmed — ${biz().name}`,
    html: await orderConfirmedHtml({
      number: order.number,
      id: order.id,
      name: order.shippingAddress?.name ?? null,
      items,
      currency: order.currency,
      lines: [
        ["Subtotal", order.subtotal],
        ["Discount", -order.discount],
        ["Gift card", -order.giftCardAmount],
        ["Shipping", order.shipping],
        ["Tax", order.tax ?? 0],
      ],
      total: order.total,
      address: addressHtml(order.shippingAddress),
      sizeLabel: variantLabel,
    }),
  });
}

export async function sendAdminNewOrder(order: Order, items: OrderItem[]) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const to = await staffInbox();
  if (!to) return;
  await sendEmail({
    box: "studio",
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  if (!order.email) return;
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Order #${order.number} is on its way — ${biz().name}`,
    html: shippedHtml({
      number: order.number,
      id: order.id,
      items: await orderItems(order.id).catch(() => []),
      currency: order.currency,
      carrier: order.trackingCarrier,
      tracking: order.trackingNumber,
      trackUrl: trackingUrl(order.trackingCarrier, order.trackingNumber),
      sizeLabel: variantLabel,
    }),
  });
}

export async function sendRefundNotice(order: Order, amount: number) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  if (!order.email) return;
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Refund for order #${order.number} — ${biz().name}`,
    html: refundHtml({ number: order.number, id: order.id, amount: formatMoney(amount, order.currency) }),
  });
}

export async function sendWelcome(email: string, name?: string | null) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "hello",
    to: email,
    subject: `Welcome to ${biz().name}${name ? `, ${name.trim().split(/\s+/)[0]}` : ""}`,
    html: await welcomeHtml(name),
  });
}

const button = (href: string, label: string) =>
  `<p style="margin-top:24px"><a href="${href}" style="display:inline-block;background:#060606;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</a></p>`;

export async function sendNewsletterWelcome(email: string, code: string | null, percentOff: number) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "hello",
    to: email,
    subject: code ? `Your ${percentOff}% off code — ${biz().name}` : `You're on the list — ${biz().name}`,
    html: await newsletterHtml(code, percentOff),
  });
}

export async function sendStockAlert(email: string, productName: string, size: string, slug: string, launch = false) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const product = await getProductBySlug(slug).catch(() => null);
  await sendEmail({
    box: "hello",
    to: email,
    subject: launch ? `${productName} just dropped` : `Back in stock: ${productName}${size ? ` (${size})` : ""}`,
    html: stockHtml({
      name: productName,
      size: size ? variantLabel(size) : "",
      slug,
      image: product?.images[0] ?? null,
      price: product ? formatMoney(product.unitAmount, product.currency) : null,
      launch,
    }),
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const to = card.recipientEmail || card.purchaserEmail;
  if (!to) return;
  await sendEmail({
    box: "gifts",
    to,
    subject: `${card.senderName ? `${card.senderName} sent you` : "Your"} a ${biz().name} gift card`,
    html: giftCardHtml({ amount: formatMoney(card.initialAmount, card.currency), code: card.code, to: card.recipientName, from: card.senderName, message: card.message }),
  });
  if (card.recipientEmail && card.purchaserEmail && card.recipientEmail !== card.purchaserEmail) {
    await sendEmail({
    box: "gifts",
      to: card.purchaserEmail,
      subject: `Your gift card was sent`,
      html: giftSentHtml({ amount: formatMoney(card.initialAmount, card.currency), recipient: card.recipientEmail }),
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const copy = RETURN_COPY[status];
  if (!email || !copy) return;
  await sendEmail({
    box: "returns",
    to: email,
    subject: `${copy.subject} (order #${orderNumber})`,
    html: returnHtml({ orderNumber, status, title: copy.title, body: copy.body, note: note ?? null, address: biz().returnAddress || null }),
  });
}

export async function sendContactNotification(msg: { name: string; email: string; topic: string; orderNumber: string | null; message: string }) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const to = await staffInbox();
  if (!to) return;
  await sendEmail({
    box: "studio",
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Confirm your email — ${biz().name}`,
    html: accountHtml({
      eyebrow: "One more step",
      title: "Confirm<br>it's you.",
      body: "Tap the button to confirm your email. It also links any orders you placed as a guest to your account.",
      cta: [`${siteUrl()}/account/verify?token=${encodeURIComponent(token)}`, "Confirm email"],
      note: "This link expires in 24 hours. If you didn't create an OOLU account, you can ignore this email.",
      preheader: "Confirm your email to finish setting up your account.",
    }),
  });
}

export async function sendEmailChange(newEmail: string, token: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: newEmail,
    subject: `Confirm your new email — ${biz().name}`,
    html: accountHtml({
      eyebrow: "New email",
      title: "Confirm your<br>new email.",
      body: `Tap the button to make this the email for your ${esc(biz().name)} account. You'll sign in with it from then on.`,
      cta: [`${siteUrl()}/account/confirm-email?token=${encodeURIComponent(token)}`, "Confirm new email"],
      note: "This link expires in 24 hours. If you didn't ask for this, ignore this email; nothing changes.",
      preheader: "Confirm your new email address.",
    }),
  });
}

export async function sendPasswordReset(email: string, token: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Reset your password — ${biz().name}`,
    html: accountHtml({
      eyebrow: "Password reset",
      title: "New password,<br>coming up.",
      body: "Someone (hopefully you) asked to reset the password for this account. Tap the button to choose a new one.",
      cta: [`${siteUrl()}/account/reset?token=${encodeURIComponent(token)}`, "Choose a new password"],
      note: "This link expires in 1 hour and works once. Didn't ask for this? Ignore this email and your password stays the same.",
      preheader: "Reset your password (link valid for 1 hour).",
    }),
  });
}

/** Staff created an account for this person: invite them to choose a password. */
export async function sendAccountInvite(email: string, name: string | null, token: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Your ${biz().name} account is ready`,
    html: accountHtml({
      eyebrow: "You're invited",
      title: `${name ? `${esc(name.trim().split(/\s+/)[0])},<br>` : ""}your account<br>is ready.`,
      body: `We've set up a ${esc(biz().name)} account for you: track orders, save favourites and check out faster. Choose a password to start.`,
      cta: [`${siteUrl()}/account/reset?token=${encodeURIComponent(token)}`, "Choose a password"],
      note: "This link works for 7 days. You can also sign in with Google or Apple using this email.",
      preheader: `Your ${biz().name} account is ready. Choose a password to start.`,
    }),
  });
}

export async function sendSecurityNotice(email: string, what: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Security update on your ${biz().name} account`,
    html: accountHtml({
      eyebrow: "Security",
      title: "Heads up.",
      body: esc(what),
      warn: true,
      cta: [`${siteUrl()}/account/forgot`, "Reset password"],
      preheader: what,
    }),
  });
}

export async function sendAdminCode(email: string, code: string, ttlMinutes: number) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "studio",
    to: email,
    subject: `${code} is your ${biz().name} admin code`,
    html: layout(
      "Admin sign-in",
      `<p style="font-size:14px;line-height:1.6">Use this code to open the ${esc(biz().name)} admin. It expires in ${ttlMinutes} minutes.</p>
<p style="font-size:36px;letter-spacing:12px;font-weight:bold;text-align:center;border:1px solid #111;padding:18px;font-family:Menlo,Consolas,monospace">${esc(code)}</p>
<p style="font-size:12px;color:#777">Didn't try to sign in? Someone may know your email — you can ignore this, the code is useless without access to your inbox.</p>`,
    ),
  });
  // Dev convenience: show the code itself in the terminal (emails are only logged when Resend isn't set up).
  if (!(await getKey("RESEND_API_KEY"))) console.info(`[email:dev] admin code for ${email}: ${code}`);
}
