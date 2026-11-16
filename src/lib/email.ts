import "server-only";
import { Resend } from "resend";
import { formatMoney } from "./format";
import { variantLabel } from "./variants";
import type { Order, OrderItem, ShippingAddress } from "./db/schema";
import { siteUrl } from "@/lib/site-url";
import { getKey } from "./keys";
import { biz, getBusiness, staffInbox } from "./business";
import type { Mailbox } from "./mailboxes";
import { esc, layout, newsletterHtml, welcomeHtml } from "./email-design";

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

export async function sendOrderConfirmation(order: Order, items: OrderItem[]) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  if (!order.email) return;
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Order #${order.number} confirmed — ${biz().name}`,
    html: layout(
      "Thanks for your order",
      `<p style="font-size:14px;line-height:1.6">We've got your order <strong>#${order.number}</strong> and we're getting it ready. You'll get another email when it ships.</p>
${itemsTable(order, items)}${address(order.shippingAddress)}
<p><a href="${siteUrl()}/account" style="display:inline-block;background:#060606;color:#fff;padding:12px 22px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">View your account</a></p>`,
    ),
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
  const tracking = order.trackingNumber
    ? `<p style="font-size:14px">Tracking: <strong>${esc(order.trackingCarrier)} ${esc(order.trackingNumber)}</strong></p>`
    : "";
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Order #${order.number} has shipped`,
    html: layout("Your order is on the way", `<p style="font-size:14px;line-height:1.6">Good news — order <strong>#${order.number}</strong> just left us.</p>${tracking}`),
  });
}

export async function sendRefundNotice(order: Order, amount: number) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  if (!order.email) return;
  await sendEmail({
    box: "orders",
    to: order.email,
    subject: `Refund for order #${order.number}`,
    html: layout(
      "Refund issued",
      `<p style="font-size:14px;line-height:1.6">We've refunded <strong>${formatMoney(amount, order.currency)}</strong> for order #${order.number}. It can take 5–10 business days to show up on your statement.</p>`,
    ),
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
  await sendEmail({
    box: "hello",
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const to = card.recipientEmail || card.purchaserEmail;
  if (!to) return;
  const from = card.senderName ? `${esc(card.senderName)} sent you` : "You've got";
  await sendEmail({
    box: "gifts",
    to,
    subject: `${card.senderName ? `${card.senderName} sent you` : "Your"} a ${biz().name} gift card`,
    html: layout(
      `${formatMoney(card.initialAmount, card.currency)} gift card`,
      `<p style="font-size:14px;line-height:1.6">${card.recipientName ? `${esc(card.recipientName)}, ` : ""}${from} a ${biz().name} gift card.</p>
${card.message ? `<p style="font-size:14px;line-height:1.6;font-style:italic;border-left:3px solid #111;padding-left:12px">“${esc(card.message)}”</p>` : ""}
<p style="font-size:22px;letter-spacing:3px;font-weight:bold;border:1px dashed #111;padding:14px;text-align:center">${esc(card.code)}</p>
<p style="font-size:12px;color:#777">Enter the code in your bag before checkout. Any remaining balance stays on the card.</p>
${button(`${siteUrl()}/shop`, "Start shopping")}`,
    ),
  });
  if (card.recipientEmail && card.purchaserEmail && card.recipientEmail !== card.purchaserEmail) {
    await sendEmail({
    box: "gifts",
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  const copy = RETURN_COPY[status];
  if (!email || !copy) return;
  const address = biz().returnAddress;
  await sendEmail({
    box: "returns",
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
    html: layout(
      "Confirm your email",
      `<p style="font-size:14px;line-height:1.6">Tap the button to confirm this is your email. It also connects any orders you placed as a guest to your account.</p>${button(
        `${siteUrl()}/account/verify?token=${encodeURIComponent(token)}`,
        "Confirm email",
      )}<p style="font-size:12px;color:#777">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
    ),
  });
}

export async function sendEmailChange(newEmail: string, token: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: newEmail,
    subject: `Confirm your new email — ${biz().name}`,
    html: layout(
      "Confirm your new email",
      `<p style="font-size:14px;line-height:1.6">Tap the button to make this the email for your ${biz().name} account. You'll sign in with it from then on.</p>${button(
        `${siteUrl()}/account/confirm-email?token=${encodeURIComponent(token)}`,
        "Confirm new email",
      )}<p style="font-size:12px;color:#777">This link expires in 24 hours. If you didn't ask for this, ignore this email; nothing changes.</p>`,
    ),
  });
}

export async function sendPasswordReset(email: string, token: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Reset your password — ${biz().name}`,
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
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Your ${biz().name} account is ready`,
    html: layout(
      name ? `Welcome, ${name}` : "Your account is ready",
      `<p style="font-size:14px;line-height:1.6">We've set up a ${biz().name} account for you, so you can track orders, save favourites and check out faster. Choose a password to start using it.</p>${button(
        `${siteUrl()}/account/reset?token=${encodeURIComponent(token)}`,
        "Choose a password",
      )}<p style="font-size:12px;color:#777">This link works for 7 days. You can also sign in with Google or Apple using this email.</p>`,
    ),
  });
}

export async function sendSecurityNotice(email: string, what: string) {
  await getBusiness(); // store name, tagline and return address from Admin → Settings
  await sendEmail({
    box: "account",
    to: email,
    subject: `Security update on your ${biz().name} account`,
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
