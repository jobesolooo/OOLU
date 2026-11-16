import "server-only";
import { site } from "./site";
import { siteUrl } from "./site-url";
import { biz } from "./business";
import { formatMoney } from "./format";
import { getFeaturedProducts, type Product } from "./catalog";

/**
 * OOLU's email look: a purple top strip, a heavy OOLU header, colour blocks with torn-paper
 * photos (pre-rendered in /public/images/email, since email apps can't do those effects),
 * live product cards, and a black footer. Everything is tables + inline styles so it renders
 * in Gmail, Apple Mail and Outlook. Headlines stay real text (images are decoration).
 */

export const C = { cream: "#f3f2ef", purple: "#5a44cf", lilac: "#a592ff", ink: "#060606", white: "#fdfdfd", grey: "#6b6b6b" };
const DISPLAY = "'Bebas Neue',Anton,Impact,'Arial Narrow Bold','Arial Black',sans-serif";
const MONO = "'Roboto Mono',Menlo,Consolas,'Courier New',monospace";

export const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const base = () => siteUrl().replace(/\/$/, "");
/** Absolute URL for an image (product images from Stripe are already absolute). */
export const abs = (src: string) => (/^https?:\/\//.test(src) ? src : `${base()}${src.startsWith("/") ? "" : "/"}${src}`);

export const button = (href: string, label: string, tone: "ink" | "white" | "lilac" = "ink") => {
  const bg = tone === "white" ? C.white : tone === "lilac" ? C.lilac : C.ink;
  const fg = tone === "ink" ? C.white : C.ink;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td bgcolor="${bg}" style="background:${bg}">
<a href="${href}" style="display:inline-block;padding:16px 30px;font-family:${MONO};font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${fg};text-decoration:none">${esc(label)} &rarr;</a></td></tr></table>`;
};

/** Big condensed headline. */
export const headline = (text: string, color: string = C.ink, size = 56) =>
  `<h1 style="margin:0;font-family:${DISPLAY};font-weight:900;font-size:${size}px;line-height:0.95;letter-spacing:0.5px;text-transform:uppercase;color:${color}">${text}</h1>`;

export const eyebrow = (text: string, color: string = C.purple) =>
  `<p style="margin:0 0 14px;font-family:${MONO};font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${color}">${esc(text)}</p>`;

export const para = (html: string, color: string = C.ink) => `<p style="margin:16px 0 0;font-family:${MONO};font-size:14px;line-height:1.7;color:${color}">${html}</p>`;

const img = (src: string, alt: string, width = 600) =>
  `<img src="${abs(src)}" width="${width}" alt="${esc(alt)}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none">`;

/** Full-width row. */
const row = (html: string, bg: string = C.white, pad = "40px 40px") => `<tr><td bgcolor="${bg}" style="background:${bg};padding:${pad}">${html}</td></tr>`;
const imageRow = (src: string, alt: string, bg: string) => `<tr><td bgcolor="${bg}" style="background:${bg};padding:0;line-height:0;font-size:0">${img(src, alt)}</td></tr>`;

function header() {
  const b = biz();
  return `<tr><td bgcolor="${C.purple}" style="background:${C.purple};padding:10px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:${MONO};font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.white}">${esc(b.name)} · Studio Amsterdam</td>
<td align="right" style="font-family:${MONO};font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.white}">${esc(site.established)}</td>
</tr></table></td></tr>`;
}

function wordmarkRow() {
  const logo = base().startsWith("https://") ? `<img src="${base()}/images/brand/logo-mark.png" width="44" height="42" alt="" style="vertical-align:middle;border:0;margin-right:14px">` : "";
  return `<tr><td bgcolor="${C.cream}" align="left" style="background:${C.cream};padding:28px 40px 22px">
<a href="${base()}" style="text-decoration:none;color:${C.ink}">${logo}<span style="font-family:${DISPLAY};font-weight:900;font-size:44px;letter-spacing:2px;vertical-align:middle;color:${C.ink}">${esc(site.wordmark)}</span></a></td></tr>`;
}

function footer(note?: string) {
  const b = biz();
  const social = [
    b.social.instagram && `<a href="${b.social.instagram}" style="color:${C.white};text-decoration:none">Instagram</a>`,
    b.social.tiktok && `<a href="${b.social.tiktok}" style="color:${C.white};text-decoration:none">TikTok</a>`,
    `<a href="${base()}/shop" style="color:${C.white};text-decoration:none">Shop</a>`,
    `<a href="${base()}/account" style="color:${C.white};text-decoration:none">Account</a>`,
  ]
    .filter(Boolean)
    .join(`<span style="color:${C.lilac}">&nbsp;&nbsp;/&nbsp;&nbsp;</span>`);
  return `<tr><td bgcolor="${C.ink}" style="background:${C.ink};padding:36px 40px;font-family:${MONO};color:${C.white}">
<p style="margin:0;font-family:${DISPLAY};font-size:30px;letter-spacing:1px;color:${C.lilac}">${esc(b.name)} &middot; BUILT ON TRUST</p>
<p style="margin:10px 0 0;font-size:11px;line-height:1.7;letter-spacing:2px;text-transform:uppercase;color:${C.white}">${esc(b.tagline ?? site.tagline)}</p>
<p style="margin:22px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase">${social}</p>
<p style="margin:22px 0 0;font-size:11px;line-height:1.7;color:#9a9a9a">${note ? `${note}<br>` : ""}${b.email ? `Questions? Reply to this email or write to <a href="mailto:${b.email}" style="color:#9a9a9a">${esc(b.email)}</a>.<br>` : ""}${
    b.legalName ? `${esc(b.legalName)}${b.address ? ` · ${esc(b.address)}` : ""}` : esc(b.name)
  }</p>
</td></tr>`;
}

/** Outer frame shared by every email. `rows` are <tr>s. */
export function shell(rows: string, opts: { preheader?: string; note?: string; bare?: boolean } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(biz().name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(opts.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.cream}" style="background:${C.cream}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.white}">
${header()}${opts.bare ? "" : wordmarkRow()}${rows}${footer(opts.note)}
</table></td></tr></table></body></html>`;
}

/** Standard email (orders, accounts, returns…): title + body in the new frame. */
export function layout(title: string, body: string, opts: { preheader?: string; note?: string; eyebrow?: string } = {}) {
  return shell(
    row(`${opts.eyebrow ? eyebrow(opts.eyebrow) : ""}${headline(esc(title), C.ink, 44)}<div style="font-family:${MONO};font-size:14px;line-height:1.7;color:${C.ink}">${body}</div>`, C.white, "36px 40px 44px"),
    { preheader: opts.preheader ?? title, note: opts.note },
  );
}

/** Two-column product cards with real photos, names and prices. */
function productGrid(products: Product[]) {
  const card = (p: Product) => `<td width="50%" valign="top" style="padding:0 8px 22px">
<a href="${base()}/products/${p.slug}" style="text-decoration:none;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="${C.cream}" style="background:${C.cream};border:3px solid ${C.ink};line-height:0;font-size:0">${p.images[0] ? img(p.images[0], p.name, 256) : ""}</td></tr></table>
<p style="margin:12px 0 0;font-family:${DISPLAY};font-size:22px;line-height:1;letter-spacing:0.5px;text-transform:uppercase;color:${C.ink}">${esc(p.name.replace(/^OOLU\s+/i, ""))}</p>
<p style="margin:6px 0 0;font-family:${MONO};font-size:12px;letter-spacing:1px;color:${C.purple}"><strong>${formatMoney(p.unitAmount, p.currency)}</strong>&nbsp;&nbsp;<span style="color:${C.ink};text-decoration:underline">Shop &rarr;</span></p>
</a></td>`;
  const rows: string[] = [];
  for (let i = 0; i < products.length; i += 2) rows.push(`<tr>${card(products[i])}${products[i + 1] ? card(products[i + 1]) : `<td width="50%"></td>`}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -8px">${rows.join("")}</table>`;
}

const perks = (items: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${items
    .map(
      ([t, s]) => `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:0 6px">
<p style="margin:0;font-family:${DISPLAY};font-size:26px;line-height:1;color:${C.lilac}">${t}</p>
<p style="margin:8px 0 0;font-family:${MONO};font-size:11px;line-height:1.5;letter-spacing:1px;text-transform:uppercase;color:${C.white}">${s}</p></td>`,
    )
    .join("")}</tr></table>`;

async function newArrivals(limit = 4) {
  try {
    const all = (await getFeaturedProducts(12)).filter((p) => p.images[0]);
    // Prefer pieces that can be bought right now; if nothing has stock yet, still show the collection.
    const inStock = all.filter((p) => p.soldOut.length < Math.max(1, p.sizes.length * Math.max(1, p.colors.length)));
    return (inStock.length >= 2 ? inStock : all).slice(0, limit);
  } catch {
    return [];
  }
}

/** Account created. */
export async function welcomeHtml(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  const products = await newArrivals();
  return shell(
    imageRow("/images/email/welcome-hero.jpg", `${biz().name} tracksuit set`, C.purple) +
      row(
        `${eyebrow("New member", C.lilac)}${headline(`Welcome to<br>the crew${first ? `,<br>${esc(first)}` : ""}.`, C.white, 64)}
${para("Your account is live. Track every order, check out in seconds, keep a wishlist, and get first access when a drop goes live.", C.white)}
${button(`${base()}/shop`, "Shop the collection", "white")}`,
        C.purple,
        "10px 40px 48px",
      ) +
      imageRow("/images/email/signature-block.jpg", "Signature fit", C.purple) +
      row(
        `${eyebrow("Built to stand out")}${headline("Rooted in Africa.<br>Made in Amsterdam.", C.ink, 44)}
${para("Every OOLU piece starts with where we come from: heavyweight fabrics, the orbit mark, and a relaxed fit made to move. Made for the world.")}`,
        C.cream,
        "8px 40px 40px",
      ) +
      (products.length
        ? row(`${eyebrow("New arrivals")}${headline("Pick your first piece", C.ink, 40)}<div style="height:22px;line-height:22px">&nbsp;</div>${productGrid(products)}${button(`${base()}/shop`, "See everything")}`, C.white, "40px 32px 44px")
        : "") +
      row(perks([["Track", "Every order, live"], ["Faster", "One-tap checkout"], ["First", "Early drop access"], ["Save", "Your wishlist"]]), C.ink, "34px 34px"),
    { preheader: `Your ${biz().name} account is ready. Here's what's new in the studio.`, note: "You're getting this because you created an account.", bare: true },
  );
}

/** Newsletter sign-up (with an optional welcome code). */
export async function newsletterHtml(code: string | null, percentOff: number) {
  const products = await newArrivals();
  const codeBlock = code
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td bgcolor="${C.white}" style="background:${C.white};border:3px dashed ${C.ink};padding:18px 26px">
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.purple}">Your code · ${percentOff}% off</p>
<p style="margin:6px 0 0;font-family:${DISPLAY};font-size:44px;letter-spacing:4px;color:${C.ink}">${esc(code)}</p></td></tr></table>
${para("One use, on your first order. Enter it at checkout.", C.white)}`
    : "";
  return shell(
    imageRow("/images/email/welcome-hero.jpg", `${biz().name} tracksuit set`, C.purple) +
      row(
        `${eyebrow("You're on the list", C.lilac)}${headline(code ? `${percentOff}% off<br>is yours.` : "You're in.", C.white, 64)}
${para("First access to drops, restocks and stories from the studio in Amsterdam. No spam, ever.", C.white)}${codeBlock}
${button(`${base()}/shop`, "Shop now", "white")}`,
        C.purple,
        "10px 40px 48px",
      ) +
      (products.length ? row(`${eyebrow("In the studio now")}${headline("Start here", C.ink, 40)}<div style="height:22px;line-height:22px">&nbsp;</div>${productGrid(products)}`, C.white, "40px 32px 30px") : "") +
      row(perks([["Drops", "Before anyone else"], ["Restocks", "The moment they land"], ["Stories", "From Amsterdam"]]), C.ink, "34px 34px"),
    { preheader: code ? `Here's ${percentOff}% off your first order.` : "First access to every drop.", note: "You're getting this because you joined the newsletter. Unsubscribe any time by replying 'stop'.", bare: true },
  );
}

/* ═══ Campaign builder + versions for every customer email ═══════════════ */

type CampaignOpts = {
  hero: string;
  heroAlt: string;
  /** Colour the hero image's torn bottom edge runs into (the block below). */
  eyebrow: string;
  title: string;
  body?: string;
  /** Extra HTML inside the purple block (code boxes, amounts…). */
  extra?: string;
  cta?: [href: string, label: string];
  /** Rows after the purple block. */
  rows?: string;
  perks?: [string, string][];
  preheader: string;
  note?: string;
};

export function campaign(o: CampaignOpts) {
  return shell(
    imageRow(o.hero, o.heroAlt, C.purple) +
      row(
        `${eyebrow(o.eyebrow, C.lilac)}${headline(o.title, C.white, 60)}${o.body ? para(o.body, C.white) : ""}${o.extra ?? ""}${o.cta ? button(o.cta[0], o.cta[1], "white") : ""}`,
        C.purple,
        "10px 40px 48px",
      ) +
      (o.rows ?? "") +
      (o.perks ? row(perks(o.perks), C.ink, "34px 34px") : ""),
    { preheader: o.preheader, note: o.note, bare: true },
  );
}

const sectionTitle = (t: string) => `<p style="margin:0 0 16px;font-family:${DISPLAY};font-size:28px;line-height:1;letter-spacing:0.5px;text-transform:uppercase;color:${C.ink}">${t}</p>`;

/** Progress like "Placed → Packed → Shipped → Delivered"; `done` steps are filled. */
export function steps(labels: string[], done: number) {
  const w = Math.floor(100 / labels.length);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${labels
    .map((l, i) => {
      const on = i < done;
      const now = i === done;
      const dot = on ? `background:${C.purple};color:${C.white};border:3px solid ${C.purple}` : now ? `background:${C.white};color:${C.ink};border:3px solid ${C.ink}` : `background:${C.white};color:#b5b5b5;border:3px solid #d9d9d9`;
      return `<td width="${w}%" align="center" valign="top" style="padding:0 2px">
<div style="width:34px;height:34px;line-height:28px;border-radius:50%;font-family:${MONO};font-size:13px;font-weight:bold;${dot}">${on ? "&#10003;" : i + 1}</div>
<p style="margin:8px 0 0;font-family:${MONO};font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${on || now ? C.ink : "#9a9a9a"}">${esc(l)}</p></td>`;
    })
    .join("")}</tr></table>`;
}

type LineItem = { name: string; size: string | null; quantity: number; unitAmount: number; image: string | null };
export function itemCards(items: LineItem[], currency: string, sizeLabel: (s: string) => string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
    .map(
      (i) => `<tr><td width="76" valign="top" style="padding:0 0 14px">${
        i.image
          ? `<img src="${abs(i.image)}" width="64" alt="" style="display:block;width:64px;height:auto;border:3px solid ${C.ink};background:${C.cream}">`
          : `<div style="width:64px;height:80px;background:${C.cream};border:3px solid ${C.ink}"></div>`
      }</td>
<td valign="top" style="padding:4px 0 14px 4px;font-family:${MONO};font-size:13px;line-height:1.5;color:${C.ink}">
<span style="font-family:${DISPLAY};font-size:20px;letter-spacing:0.5px;text-transform:uppercase">${esc(i.name.replace(/^OOLU\s+/i, ""))}</span><br>
<span style="color:${C.grey}">${i.size && i.size !== "One Size" ? `${esc(sizeLabel(i.size))} · ` : ""}Qty ${i.quantity}</span></td>
<td valign="top" align="right" style="padding:4px 0 14px;font-family:${MONO};font-size:13px;font-weight:bold;color:${C.ink};white-space:nowrap">${formatMoney(i.unitAmount * i.quantity, currency)}</td></tr>`,
    )
    .join("")}</table>`;
}

export function totals(lines: [string, number][], total: number, currency: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:3px solid ${C.ink};margin-top:4px">${lines
    .filter(([, v]) => v !== 0)
    .map(
      ([l, v]) =>
        `<tr><td style="padding:8px 0 0;font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.grey}">${l}</td><td align="right" style="padding:8px 0 0;font-family:${MONO};font-size:13px;color:${C.ink}">${v < 0 ? "−" : ""}${formatMoney(Math.abs(v), currency)}</td></tr>`,
    )
    .join("")}
<tr><td style="padding:14px 0 0;font-family:${DISPLAY};font-size:26px;text-transform:uppercase;color:${C.ink}">Total</td><td align="right" style="padding:14px 0 0;font-family:${DISPLAY};font-size:26px;color:${C.purple}">${formatMoney(total, currency)}</td></tr></table>`;
}

const box = (html: string, bg: string = C.cream) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="${bg}" style="background:${bg};border:3px solid ${C.ink};padding:20px 22px;font-family:${MONO};font-size:13px;line-height:1.7;color:${C.ink}">${html}</td></tr></table>`;

/** Order confirmed. */
export async function orderConfirmedHtml(o: {
  number: number;
  id: string;
  name: string | null;
  items: LineItem[];
  currency: string;
  lines: [string, number][];
  total: number;
  address: string | null;
  sizeLabel: (s: string) => string;
}) {
  const first = o.name?.trim().split(/\s+/)[0];
  const more = (await newArrivals(6)).filter((p) => !o.items.some((i) => i.name === p.name)).slice(0, 2);
  return campaign({
    hero: "/images/email/order-hero.jpg",
    heroAlt: "Order confirmed",
    eyebrow: `Order #${o.number}`,
    title: `It's yours${first ? `,<br>${esc(first)}` : ""}.`,
    body: "Thank you for backing OOLU. We're packing your order in the studio now, and you'll get an email with tracking the moment it ships.",
    cta: [`${base()}/account/orders/${o.id}`, "Track your order"],
    rows:
      row(`${sectionTitle("Where it's at")}${steps(["Placed", "Packing", "Shipped", "Delivered"], 1)}`, C.white, "38px 32px 10px") +
      row(`${sectionTitle("What you got")}${itemCards(o.items, o.currency, o.sizeLabel)}${totals(o.lines, o.total, o.currency)}`, C.white, "30px 40px 30px") +
      (o.address ? row(box(`<strong style="font-family:${DISPLAY};font-size:20px;letter-spacing:0.5px">SHIPPING TO</strong><br>${o.address}`), C.white, "0 40px 40px") : "") +
      (more.length ? row(`${eyebrow("Complete the look")}${headline("Goes well with", C.ink, 36)}<div style="height:20px;line-height:20px">&nbsp;</div>${productGrid(more)}`, C.cream, "40px 32px 26px") : ""),
    perks: [[`${biz().returnDays} days`, "To return or exchange"], ["Track", "From your account"], ["Help", "Just reply to this email"]],
    preheader: `Order #${o.number} is confirmed. We're packing it now.`,
  });
}

/** Shipped. */
export function shippedHtml(o: { number: number; id: string; items: LineItem[]; currency: string; carrier: string | null; tracking: string | null; trackUrl: string | null; sizeLabel: (s: string) => string }) {
  const trackBox =
    o.tracking &&
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td bgcolor="${C.white}" style="background:${C.white};border:3px solid ${C.ink};padding:16px 22px">
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.purple}">${esc(o.carrier ?? "Tracking")} tracking</p>
<p style="margin:6px 0 0;font-family:${MONO};font-size:20px;font-weight:bold;letter-spacing:2px;color:${C.ink}">${esc(o.tracking)}</p></td></tr></table>`;
  return campaign({
    hero: "/images/email/ship-hero.jpg",
    heroAlt: "Your order is on its way",
    eyebrow: `Order #${o.number} · Shipped`,
    title: "On its way.",
    body: "Your OOLU order just left the studio in Amsterdam. Keep an eye on the door.",
    extra: trackBox || "",
    cta: o.trackUrl ? [o.trackUrl, "Track your parcel"] : [`${base()}/account/orders/${o.id}`, "View your order"],
    rows:
      row(`${sectionTitle("Where it's at")}${steps(["Placed", "Packed", "Shipped", "Delivered"], 3)}`, C.white, "38px 32px 10px") +
      (o.items.length ? row(`${sectionTitle("In the box")}${itemCards(o.items, o.currency, o.sizeLabel)}`, C.white, "30px 40px 30px") : ""),
    perks: [["Wear it", biz().handles.instagram ? `Tag ${biz().handles.instagram}` : "Show us the fit"], ["Fits?", `${biz().returnDays}-day returns`], ["Help", "Just reply"]],
    preheader: `Order #${o.number} has shipped${o.tracking ? ` · tracking ${o.tracking}` : ""}.`,
  });
}

const amountBlock = (label: string, amount: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td bgcolor="${C.white}" style="background:${C.white};border:3px solid ${C.ink};padding:16px 26px">
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.purple}">${esc(label)}</p>
<p style="margin:4px 0 0;font-family:${DISPLAY};font-size:52px;line-height:1;color:${C.ink}">${amount}</p></td></tr></table>`;

/** Refund issued. */
export function refundHtml(o: { number: number; id: string; amount: string }) {
  return campaign({
    hero: "/images/email/account-banner.jpg",
    heroAlt: OOLU_ALT,
    eyebrow: `Order #${o.number} · Refund`,
    title: "Money's<br>on its way.",
    body: "We've sent your refund. It usually shows up on your statement within 5–10 business days, depending on your bank.",
    extra: amountBlock("Refunded", o.amount),
    cta: [`${base()}/account/orders/${o.id}`, "View your order"],
    rows: row(para(`Something not right? Just reply to this email and we'll sort it out.`), C.white, "30px 40px 36px"),
    preheader: `We've refunded ${o.amount} for order #${o.number}.`,
  });
}
const OOLU_ALT = "OOLU";

/** Back in stock / just dropped: the product itself is the hero. */
export function stockHtml(o: { name: string; size: string; slug: string; image: string | null; price: string | null; launch: boolean }) {
  const href = `${base()}/products/${o.slug}`;
  const productHero = o.image
    ? `<tr><td bgcolor="${C.cream}" align="center" style="background:${C.cream};padding:34px 40px 30px">
<a href="${href}" style="text-decoration:none"><img src="${abs(o.image)}" width="420" alt="${esc(o.name)}" style="display:block;width:100%;max-width:420px;height:auto;border:4px solid ${C.ink};background:${C.white}"></a>
</td></tr>`
    : "";
  return shell(
    productHero +
      row(
        `${eyebrow(o.launch ? "Just dropped" : "Back in stock", C.lilac)}${headline(o.launch ? "It's live." : "It's back.", C.white, 72)}
<p style="margin:18px 0 0;font-family:${DISPLAY};font-size:30px;line-height:1.05;text-transform:uppercase;color:${C.white}">${esc(o.name.replace(/^OOLU\s+/i, ""))}${o.size ? ` <span style="color:${C.lilac}">· ${esc(o.size)}</span>` : ""}</p>
${o.price ? `<p style="margin:8px 0 0;font-family:${MONO};font-size:15px;font-weight:bold;color:${C.lilac}">${o.price}</p>` : ""}
${para(o.launch ? "You asked to hear first. It's out now, in limited numbers." : "The size you were waiting for just landed. Stock is limited: first come, first served.", C.white)}
${button(href, o.launch ? "Shop the drop" : "Get yours", "white")}`,
        C.purple,
        "40px 40px 48px",
      ) +
      row(perks([["Limited", "Small runs only"], ["Fast", "Ships from Amsterdam"], ["Easy", `${biz().returnDays}-day returns`]]), C.ink, "34px 34px"),
    { preheader: o.launch ? `${o.name} just dropped.` : `${o.name}${o.size ? ` (${o.size})` : ""} is back in stock.`, note: "You're getting this because you asked to be told when this item is available." },
  );
}

/** Gift card for the recipient. */
export function giftCardHtml(o: { amount: string; code: string; to: string | null; from: string | null; message: string | null }) {
  return campaign({
    hero: "/images/email/gift-hero.jpg",
    heroAlt: "OOLU gift card",
    eyebrow: o.from ? `From ${o.from}` : "Gift card",
    title: `${o.to ? `${esc(o.to)},<br>` : ""}this one's<br>for you.`,
    body: `${o.from ? `${esc(o.from)} sent you` : "You've got"} an OOLU gift card. Pick something that feels like you.`,
    extra:
      (o.message ? `<p style="margin:24px 0 0;padding:0 0 0 16px;border-left:4px solid ${C.lilac};font-family:${MONO};font-size:15px;line-height:1.7;font-style:italic;color:${C.white}">“${esc(o.message)}”</p>` : "") +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr><td bgcolor="${C.ink}" style="background:${C.ink};border:3px solid ${C.lilac};padding:20px 26px">
<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.lilac}">Gift card · ${o.amount}</p>
<p style="margin:8px 0 0;font-family:${MONO};font-size:24px;font-weight:bold;letter-spacing:3px;color:${C.white}">${esc(o.code)}</p></td></tr></table>`,
    cta: [`${base()}/shop`, "Start shopping"],
    rows: row(`${sectionTitle("How to use it")}${para("Add what you like to your bag, open the bag and enter the code before checkout. Anything left over stays on the card for next time.")}`, C.white, "36px 40px 40px"),
    perks: [["Any", "Piece in the shop"], ["Keep", "Leftover balance"], ["Easy", "Enter it in your bag"]],
    preheader: `${o.from ? `${o.from} sent you` : "You've got"} a ${o.amount} OOLU gift card.`,
    note: "Keep this email: the code is your gift card.",
  });
}

export function giftSentHtml(o: { amount: string; recipient: string }) {
  return campaign({
    hero: "/images/email/gift-hero.jpg",
    heroAlt: "OOLU gift card",
    eyebrow: "Gift card sent",
    title: "Gift<br>delivered.",
    body: `We emailed your ${o.amount} gift card to ${esc(o.recipient)}. Good taste.`,
    cta: [`${base()}/shop`, "Treat yourself too"],
    preheader: `Your ${o.amount} gift card was sent to ${o.recipient}.`,
  });
}

/** Return status update. */
export function returnHtml(o: { orderNumber: number; status: string; title: string; body: string; note: string | null; address: string | null }) {
  const order = ["requested", "approved", "received", "refunded"];
  const at = order.indexOf(o.status);
  const titles: Record<string, string> = { requested: "Got it.", approved: "Approved.", received: "It's here.", refunded: "Refunded.", rejected: "About your return." };
  return campaign({
    hero: "/images/email/account-banner.jpg",
    heroAlt: OOLU_ALT,
    eyebrow: `Order #${o.orderNumber} · ${o.title}`,
    title: titles[o.status] ?? esc(o.title),
    body: esc(o.body),
    extra: o.note ? `<p style="margin:18px 0 0;padding:0 0 0 16px;border-left:4px solid ${C.lilac};font-family:${MONO};font-size:14px;line-height:1.7;color:${C.white}">${esc(o.note)}</p>` : "",
    cta: [`${base()}/account/orders`, "View your orders"],
    rows:
      (at >= 0 ? row(`${sectionTitle("Return progress")}${steps(["Requested", "Approved", "Received", "Refunded"], o.status === "refunded" ? 4 : at + 1)}`, C.white, "38px 32px 24px") : "") +
      (o.status === "approved" && o.address
        ? row(box(`<strong style="font-family:${DISPLAY};font-size:20px;letter-spacing:0.5px">SEND IT TO</strong><br>${esc(o.address).replace(/\|/g, "<br>")}<br><br><span style="color:${C.grey}">Put your order number #${o.orderNumber} inside the parcel.</span>`), C.white, "10px 40px 40px")
        : ""),
    preheader: `${o.title} for order #${o.orderNumber}.`,
  });
}

/** Account emails: confirm email, reset password, invite, email change, security notice. */
export function accountHtml(o: { eyebrow: string; title: string; body: string; cta?: [string, string]; note?: string; warn?: boolean; preheader: string }) {
  return campaign({
    hero: "/images/email/account-banner.jpg",
    heroAlt: OOLU_ALT,
    eyebrow: o.eyebrow,
    title: o.title,
    body: o.body,
    extra: o.warn ? `<p style="margin:20px 0 0;padding:12px 16px;background:${C.ink};font-family:${MONO};font-size:12px;line-height:1.6;color:${C.white}"><strong style="color:${C.lilac}">Wasn't you?</strong> Reset your password straight away and reply to this email so we can help.</p>` : "",
    cta: o.cta,
    rows: o.note ? row(`<p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.7;color:${C.grey}">${o.note}</p>`, C.white, "26px 40px 30px") : "",
    preheader: o.preheader,
  });
}
