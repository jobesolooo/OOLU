import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { getBusiness } from "@/lib/business";
import { getProducts, isUpcoming } from "@/lib/catalog";
import { getStockMap, stockKey } from "@/lib/inventory";
import { allVariantKeys } from "@/lib/variants";
import { siteUrl } from "@/lib/site-url";
import { cx } from "@/lib/format";
import { BusinessDetails } from "./BusinessDetails";

function Row({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[13px] leading-relaxed">
      {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} /> : <Circle className="mt-0.5 size-4 shrink-0 text-black/25" strokeWidth={2} />}
      <span className={cx(done && "text-ash")}>{children}</span>
    </li>
  );
}

const Out = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
    {children}
    <ExternalLink className="size-3" />
  </a>
);

/** Settings → Google & SEO: verification codes, the sitemap and product feed links, and what's still missing. */
export async function SearchVisibility() {
  const [b, products] = await Promise.all([getBusiness(), getProducts()]);
  const stock = await getStockMap(products.map((p) => p.id));
  const base = siteUrl();
  const buyable = products.filter((p) => !isUpcoming(p) && allVariantKeys(p).some((k) => (stock.get(stockKey(p.id, k)) ?? 1) > 0));
  const noDesc = products.filter((p) => (p.description ?? "").trim().length < 50);
  const legalDone = Boolean(b.legalName && b.address && b.kvk);

  return (
    <div className="space-y-3">
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Already done for you</h3>
        <p className="mb-4 text-[12px] text-ash">The site tells Google everything it needs on every page. Nothing to do here; it updates itself as products change.</p>
        <ul className="grid gap-x-6 gap-y-1.5 text-[12px] text-black/70 sm:grid-cols-2">
          <li>✓ Own title, description and link per page</li>
          <li>✓ Product price, stock, shipping and returns for Google Shopping</li>
          <li>✓ Star ratings from approved reviews</li>
          <li>✓ Breadcrumbs, brand name and logo in results</li>
          <li>✓ Sitemap with every product and its photos</li>
          <li>✓ Product feed for free Google Shopping listings</li>
          <li>✓ Large image previews and link previews when shared</li>
          <li>✓ Private pages (account, cart, admin) kept out of Google</li>
        </ul>
      </div>

      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Your steps</h3>
        <p className="mb-4 text-[12px] text-ash">Do these once. Google usually starts showing new pages within a few days to a few weeks.</p>
        <ol className="space-y-2.5">
          <Row done={Boolean(b.googleVerify)}>
            Open <Out href="https://search.google.com/search-console">Google Search Console</Out>, add <strong>{base}</strong> as a URL-prefix property, choose <em>HTML tag</em>, paste it below and save, then press Verify there.
          </Row>
          <Row done={false}>
            In Search Console → Sitemaps, submit <code className="select-all break-all">{base}/sitemap.xml</code>
          </Row>
          <Row done={false}>
            Open <Out href="https://merchants.google.com">Google Merchant Center</Out> (free), claim {base.replace(/^https?:\/\//, "")}, then Products → Add products → From a file → scheduled fetch with{" "}
            <code className="select-all break-all">{base}/feed/google.xml</code>. Your products then show for free in the Shopping tab and Google Images.
          </Row>
          <Row done={Boolean(b.bingVerify)}>
            Optional: <Out href="https://www.bing.com/webmasters">Bing Webmaster Tools</Out> can import everything from Search Console in one click (also covers DuckDuckGo and ChatGPT search).
          </Row>
          <Row done={buyable.length > 0}>
            Stock: {buyable.length} of {products.length} products can be bought. Sold-out products still show in Google, but marked out of stock and left out of Shopping.{" "}
            <a href="/admin/inventory" className="underline">Set stock</a>
          </Row>
          <Row done={noDesc.length === 0}>
            {noDesc.length ? `${noDesc.length} product${noDesc.length === 1 ? " has" : "s have"} a very short description (${noDesc.slice(0, 3).map((p) => p.name).join(", ")}${noDesc.length > 3 ? "…" : ""}). Two or three sentences on fit, fabric and feel helps them rank.` : "Every product has a proper description."}
          </Row>
          <Row done={legalDone}>
            Company name, address and KvK filled in under <a href="/admin/settings?tab=business" className="underline">Business</a>: Google trusts shops with clear contact details more.
          </Row>
        </ol>
      </div>

      <BusinessDetails part="search" />
    </div>
  );
}
