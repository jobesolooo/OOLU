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
