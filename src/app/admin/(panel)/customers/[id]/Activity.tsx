import { Eye, FileText, Heart, MousePointerClick, Search, ShoppingBag, CreditCard } from "lucide-react";
import { customerActivity } from "@/lib/insights";
import { formatMoney } from "@/lib/format";
import { Panel } from "../../ui";

const PAGES: Record<string, string> = { "/": "the home page", "/shop": "the shop", "/cart": "their bag", "/account": "their account", "/gift-cards": "gift cards", "/journal": "the journal" };

/** What this customer did on the store recently (only while signed in). */
export async function CustomerActivity({ userId, products, now }: { userId: string; products: Map<string, { name: string }>; now: number }) {
  const rows = await customerActivity(userId);
  const when = (d: Date) => {
    const m = Math.round((now - new Date(d).getTime()) / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    if (m < 24 * 60) return `${Math.floor(m / 60)} h ago`;
    return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
  };
  const describe = (r: (typeof rows)[number]) => {
    const name = r.productId ? (products.get(r.productId)?.name ?? "a product") : null;
    switch (r.type) {
      case "pageview":
        return { Icon: name ? Eye : FileText, text: name ? `Looked at ${name}` : `Opened ${PAGES[r.path] ?? r.path}` };
      case "add_to_cart":
        return { Icon: ShoppingBag, text: `Added ${name ?? "an item"}${r.label ? ` (${r.label})` : ""} to the bag`, strong: true };
      case "wishlist_add":
        return { Icon: Heart, text: `Saved ${name ?? "an item"} to their wishlist` };
      case "search":
        return { Icon: Search, text: `Searched “${r.label}”${r.value != null ? ` · ${r.value} result${r.value === 1 ? "" : "s"}` : ""}` };
      case "checkout_start":
        return { Icon: CreditCard, text: `Started checkout${r.value ? ` · ${formatMoney(r.value)}` : ""}`, strong: true };
      default:
        return { Icon: MousePointerClick, text: `Clicked “${r.label}”` };
    }
  };

  return (
    <Panel title="Activity on the store">
      {rows.length === 0 ? (
        <p className="py-3 text-center text-[12px] text-ash">Nothing yet. Activity shows up here while this customer browses signed in.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-black/10 pl-5">
          {rows.map((r, i) => {
            const d = describe(r);
            return (
              <li key={i} className="relative text-[13px]">
                <span className="absolute top-0.5 -left-[29px] grid size-[18px] place-items-center rounded-full bg-white ring-1 ring-black/10">
                  <d.Icon className="size-2.5 text-ash" />
                </span>
                <span className={d.strong ? "font-medium" : undefined}>{d.text}</span>
                <span className="ml-2 text-[11px] text-ash">
                  {when(r.at)}
                  {r.device && ` · ${r.device}`}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
