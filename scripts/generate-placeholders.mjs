// Generates the placeholder artwork in /public/images.
// Replace these files with real photography whenever it's ready.
// Usage: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "images");
mkdirSync(join(out, "products"), { recursive: true });
const write = (name, svg) => writeFileSync(join(out, name), svg.trim() + "\n");

const noise = (id, opacity = 0.18, freq = 0.9) => `
<filter id="${id}" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 ${opacity}"/></feComponentTransfer>
</filter>`;

const concrete = (w, h, from, to, { panels = true, light = false } = {}) => `
<defs>
  <radialGradient id="bg" cx="${light ? 0.55 : 0.45}" cy="0.35" r="0.9">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </radialGradient>
  <linearGradient id="vig" x1="0" x2="1">
    <stop offset="0" stop-color="#000" stop-opacity="${light ? 0 : 0.55}"/>
    <stop offset="0.35" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.75" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${light ? 0.12 : 0.6}"/>
  </linearGradient>
  ${noise("n", light ? 0.14 : 0.22)}
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${
  panels
    ? Array.from({ length: 4 }, (_, i) => {
        const x = Math.round((w / 4) * i + w / 8);
        return `<rect x="${x}" y="0" width="2" height="${h}" fill="${light ? "#000" : "#fff"}" opacity="0.05"/>`;
      }).join("")
    : ""
}
<rect width="${w}" height="${h}" filter="url(#n)"/>
<rect width="${w}" height="${h}" fill="url(#vig)"/>`;

// ── Garments (400×400 artboard) ───────────────────────────────────────────
const TEE =
  "M128 78 L168 60 Q200 84 232 60 L272 78 L342 122 L314 176 L282 160 L282 352 Q200 362 118 352 L118 160 L86 176 L58 122 Z";
const HOODIE =
  "M132 92 L166 70 Q200 40 234 70 L268 92 L322 128 L346 330 L310 336 L290 190 L288 356 Q200 366 112 356 L110 190 L90 336 L54 330 L78 128 Z";

const tee = (color, print = "", collar = "#00000033") => `
<path d="${TEE}" fill="${color}"/>
<path d="${TEE}" fill="url(#shade)"/>
<path d="M168 60 Q200 92 232 60" fill="none" stroke="${collar}" stroke-width="7"/>
${print}`;

const hoodie = (color, print = "") => `
<path d="${HOODIE}" fill="${color}"/>
<path d="${HOODIE}" fill="url(#shade)"/>
<path d="M166 70 Q200 112 234 70" fill="none" stroke="#ffffff14" stroke-width="6"/>
<path d="M150 270 L250 270 L262 330 L138 330 Z" fill="#00000030"/>
${print}`;

const cap = (color, print = "") => `
<path d="M92 236 Q92 120 200 112 Q308 120 308 236 Z" fill="${color}"/>
<path d="M92 236 Q92 120 200 112 Q308 120 308 236 Z" fill="url(#shade)"/>
<path d="M200 112 L200 236" stroke="#00000022" stroke-width="3"/>
<circle cx="200" cy="114" r="7" fill="${color}" stroke="#00000033" stroke-width="2"/>
<path d="M86 234 Q200 216 314 234 Q352 246 344 262 Q200 248 70 268 Q52 252 86 234 Z" fill="${color}"/>
<path d="M86 234 Q200 216 314 234 Q352 246 344 262 Q200 248 70 268 Q52 252 86 234 Z" fill="#00000035"/>
${print}`;

const palm = (x, y, s, color) => `
<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
  <path d="M0 0 Q3 -30 1 -60 L4 -60 Q7 -30 4 0 Z"/>
  <path d="M2 -60 Q-18 -70 -30 -58 Q-14 -66 2 -58 Z"/><path d="M2 -60 Q22 -72 34 -58 Q16 -66 2 -58 Z"/>
  <path d="M2 -60 Q-10 -80 -24 -80 Q-8 -74 2 -58 Z"/><path d="M2 -60 Q14 -82 28 -80 Q12 -74 2 -58 Z"/>
  <path d="M2 -60 Q2 -84 -4 -90 Q8 -82 4 -60 Z"/>
</g>`;

const garmentSvg = (body, bg = "#e8e7e3") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">
<defs>
  <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.10"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
  </linearGradient>
  <linearGradient id="purple" x1="0" x2="1"><stop offset="0" stop-color="#7c5cc4"/><stop offset="1" stop-color="#c9b8f0"/></linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="400" height="400" fill="${bg}"/>
<ellipse cx="200" cy="366" rx="140" ry="10" fill="#000" opacity="0.12" filter="url(#soft)"/>
${body}
</svg>`;

const brushWST = (fill) => `
<text x="200" y="196" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-style="italic" font-size="66" fill="${fill}" transform="skewX(-8) translate(26 0)" letter-spacing="2">WST</text>
<path d="M140 206 Q200 196 262 204" stroke="${fill}" stroke-width="3" fill="none" opacity="0.7"/>`;

const products = {
  "brushstroke-tee-black": tee("#151515", brushWST("url(#purple)"), "#ffffff22"),
  "brushstroke-tee-red": tee("#b4151c", brushWST("#f3f0ee"), "#00000033"),
  "paint-the-west": tee(
    "#ece6da",
    `<g opacity="0.9">
      <circle cx="170" cy="168" r="34" fill="#3b5bdb"/><circle cx="232" cy="176" r="30" fill="#e8590c"/>
      <circle cx="204" cy="214" r="30" fill="#ae3ec9"/><circle cx="160" cy="226" r="16" fill="#e64980"/>
      <circle cx="246" cy="222" r="14" fill="#1098ad"/><rect x="176" y="236" width="5" height="40" rx="2" fill="#ae3ec9"/>
      <rect x="226" y="230" width="4" height="30" rx="2" fill="#e8590c"/><rect x="200" y="240" width="4" height="54" rx="2" fill="#3b5bdb"/>
    </g>
    <text x="200" y="230" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="104" fill="#111">W</text>`,
    "#00000022",
  ),
  "west-side-testament-tee": tee(
    "#4a2f22",
    `<text x="200" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#b98a5e" letter-spacing="2">WEST SIDE</text>
     <rect x="168" y="160" width="64" height="74" fill="none" stroke="#b98a5e" stroke-width="2"/>
     <circle cx="200" cy="184" r="12" fill="#b98a5e" opacity="0.8"/><path d="M182 228 Q200 196 218 228 Z" fill="#b98a5e" opacity="0.8"/>
     <text x="200" y="256" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#b98a5e">Testament</text>`,
  ),
  "wst-sunday-service-cap": cap(
    "#4a2f22",
    `<text x="196" y="182" text-anchor="middle" font-family="'Arial Black', sans-serif" font-size="40" fill="#efe6da">WST</text>
     <text x="196" y="204" text-anchor="middle" font-family="'Brush Script MT', cursive" font-style="italic" font-size="18" fill="#efe6da">Sunday Service</text>
     ${palm(258, 210, 0.75, "#efe6da")}`,
  ),
  "sunday-service-tee-brown": tee(
    "#4a2f22",
    `<text x="196" y="182" text-anchor="middle" font-family="'Arial Black', sans-serif" font-size="56" fill="#c7a684">WST</text>
     <text x="196" y="210" text-anchor="middle" font-family="'Brush Script MT', cursive" font-style="italic" font-size="22" fill="#c7a684">Sunday Service</text>
     ${palm(262, 214, 0.8, "#c7a684")}`,
  ),
  "west-side-tee-cream": tee(
    "#e7dcc8",
    `<text x="200" y="164" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="28" fill="#1d1d1d" letter-spacing="1">WSTABLISHED</text>
     <text x="200" y="206" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#1d1d1d">WEST SIDE</text>
     <text x="200" y="232" text-anchor="middle" font-family="'Brush Script MT', cursive" font-style="italic" font-size="20" fill="#1d1d1d">Sunday Service</text>`,
    "#00000022",
  ),
  "w-monogram-hoodie-black": hoodie(
    "#141414",
    `<text x="200" y="196" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="54" fill="#d9d4cc">W</text>`,
  ),
};

for (const [slug, body] of Object.entries(products)) write(`products/${slug}.svg`, garmentSvg(body));

// Back views (second gallery image)
const backMark = (fill) =>
  `<text x="200" y="104" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="22" fill="${fill}">W</text>`;
const backs = {
  "brushstroke-tee-black": tee("#151515", backMark("#c9b8f0"), "#ffffff22"),
  "brushstroke-tee-red": tee("#b4151c", backMark("#f3f0ee")),
  "paint-the-west": tee("#ece6da", backMark("#111"), "#00000022"),
  "west-side-testament-tee": tee("#4a2f22", backMark("#b98a5e")),
  "wst-sunday-service-cap": cap("#4a2f22", `<path d="M150 196 Q200 186 250 196" stroke="#2a1a12" stroke-width="10" fill="none"/>`),
  "sunday-service-tee-brown": tee("#4a2f22", `${backMark("#c7a684")}${palm(200, 300, 1.4, "#c7a684")}`),
  "west-side-tee-cream": tee("#e7dcc8", backMark("#1d1d1d"), "#00000022"),
  "w-monogram-hoodie-black": hoodie("#141414", ""),
};
for (const [slug, body] of Object.entries(backs)) write(`products/${slug}-back.svg`, garmentSvg(body));

// ── Category tiles (dark concrete + garment) ──────────────────────────────
const tile = (body) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 360" width="900" height="720">
${concrete(450, 360, "#4a4a48", "#121212")}
<defs>
  <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/>
  </linearGradient>
  <linearGradient id="purple" x1="0" x2="1"><stop offset="0" stop-color="#7c5cc4"/><stop offset="1" stop-color="#c9b8f0"/></linearGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient>
</defs>
<g transform="translate(55 10) scale(0.9)">${body}</g>
<rect width="450" height="360" fill="url(#fade)"/>
</svg>`;

write("tile-tshirts.svg", tile(products["brushstroke-tee-black"]));
write("tile-collections.svg", tile(products["west-side-tee-cream"]));
write("tile-caps.svg", tile(products["wst-sunday-service-cap"]));
write("tile-new.svg", tile(products["w-monogram-hoodie-black"]));

// ── Hero background + figure ──────────────────────────────────────────────
write(
  "hero.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 720" width="1600" height="720" preserveAspectRatio="xMidYMid slice">
${concrete(1600, 720, "#5a5957", "#111110")}
<rect x="1180" y="0" width="420" height="720" fill="#000" opacity="0.35"/>
<rect x="1176" y="0" width="6" height="720" fill="#fff" opacity="0.06"/>
</svg>`,
);

// Placeholder for the model cut-out that sits in front of the big wordmark.
write(
  "hero-figure.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720" width="600" height="720">
<defs>
  <linearGradient id="tee" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#5b3a2a"/><stop offset="1" stop-color="#2e1d15"/></linearGradient>
  <linearGradient id="pant" x1="0" x2="1"><stop offset="0" stop-color="#5e5f45"/><stop offset="1" stop-color="#3c3d2c"/></linearGradient>
  <linearGradient id="skin" x1="0" x2="1"><stop offset="0" stop-color="#4a3226"/><stop offset="1" stop-color="#2a1b14"/></linearGradient>
</defs>
<!-- legs -->
<path d="M200 560 L188 720 L292 720 L300 590 L308 720 L414 720 L400 560 Z" fill="url(#pant)"/>
<rect x="196" y="610" width="40" height="56" rx="6" fill="#00000030"/><rect x="368" y="610" width="40" height="56" rx="6" fill="#00000030"/>
<!-- arms -->
<path d="M150 230 L112 470 L150 540 L190 470 L200 300 Z" fill="url(#skin)"/>
<path d="M450 230 L488 470 L452 540 L410 470 L400 300 Z" fill="url(#skin)"/>
<!-- tee -->
<path d="M210 170 L258 152 Q300 186 342 152 L390 170 L462 240 L420 330 L398 318 L404 580 Q300 600 196 580 L202 318 L180 330 L138 240 Z" fill="url(#tee)"/>
<text x="300" y="320" text-anchor="middle" font-family="'Arial Black', sans-serif" font-size="64" fill="#b48f6c" opacity="0.9">WST</text>
<text x="300" y="352" text-anchor="middle" font-family="'Brush Script MT', cursive" font-style="italic" font-size="28" fill="#b48f6c" opacity="0.9">Sunday Service</text>
<path d="M258 152 Q300 230 342 152" fill="none" stroke="#d6c3a5" stroke-width="2" opacity="0.7"/>
<!-- neck + head -->
<path d="M272 120 L328 120 L332 160 Q300 178 268 160 Z" fill="url(#skin)"/>
<ellipse cx="300" cy="92" rx="44" ry="52" fill="url(#skin)"/>
<path d="M262 82 Q300 74 338 82 L336 98 Q300 92 264 98 Z" fill="#0b0b0b"/>
<!-- cap -->
<path d="M248 70 Q252 18 300 14 Q350 18 352 70 Z" fill="#4a2f22"/>
<path d="M244 68 Q300 56 362 70 Q374 80 360 84 Q300 72 246 82 Z" fill="#3a241a"/>
<text x="300" y="56" text-anchor="middle" font-family="'Arial Black', sans-serif" font-size="20" fill="#d6c3a5">WST</text>
</svg>`,
);

// ── Fresh drops band ──────────────────────────────────────────────────────
write(
  "drops.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1600" height="800" preserveAspectRatio="xMidYMid slice">
${concrete(1200, 600, "#c9c7c2", "#7d7b77", { light: true })}
<rect x="0" y="440" width="1200" height="160" fill="#6b6964" opacity="0.55"/>
<rect x="0" y="440" width="1200" height="4" fill="#fff" opacity="0.18"/>
<rect x="0" y="520" width="1200" height="80" fill="#57554f" opacity="0.5"/>
<rect x="0" y="520" width="1200" height="3" fill="#fff" opacity="0.15"/>
</svg>`,
);

// ── Footer skyline ────────────────────────────────────────────────────────
const buildings = Array.from({ length: 34 }, (_, i) => {
  const w = 30 + ((i * 37) % 50);
  const h = 40 + ((i * 53) % 140);
  const x = 380 + i * 38;
  return `<rect x="${x}" y="${300 - h}" width="${w}" height="${h}" fill="#000" opacity="0.55"/>`;
}).join("");
const palms = [60, 180, 300, 1500, 1640, 1780, 1880]
  .map((x, i) => palm(x, 300, 2.2 + (i % 3) * 0.5, "#000"))
  .join("");
write(
  "footer-skyline.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 300" width="2000" height="300" preserveAspectRatio="xMidYMax slice">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0c0b"/><stop offset="1" stop-color="#2a1d14"/></linearGradient></defs>
<rect width="2000" height="300" fill="url(#sky)"/>
${buildings}
${palms}
<rect width="2000" height="300" fill="#000" opacity="0.35"/>
</svg>`,
);

console.log("✓ Placeholder images written to public/images");
