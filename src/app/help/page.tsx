import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Mail, Package, RefreshCw, Ruler } from "lucide-react";
import { Plus } from "lucide-react";
import { formatMoneyShort } from "@/lib/format";
import { shippingConfig } from "@/lib/shipping";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import { SIZE_GUIDES } from "@/lib/demo-catalog";
import { PageHeader } from "@/components/PageHeader";
import { SizeGuideTable } from "@/components/product/SizeGuide";

export const metadata: Metadata = { title: "Help centre", description: "Shipping, returns, sizing, payments and order help." };

export default function HelpPage() {
  const { freeShippingThreshold, flatRate } = shippingConfig();
  const free = formatMoneyShort(freeShippingThreshold);

  const sections: { id: string; title: string; faqs: [string, React.ReactNode][] }[] = [
    {
      id: "orders",
      title: "Orders",
      faqs: [
        ["Where is my order?", <>Use <Link href="/track" className="underline">order tracking</Link> with your order number and email, or check your <Link href="/account" className="underline">account</Link>.</>],
        ["Can I change or cancel my order?", "We pack fast. Contact us within 2 hours of ordering and we'll do our best before it ships."],
        ["Do I need an account?", "No — you can check out as a guest. An account lets you see order history, start returns faster and write reviews."],
      ],
    },
    {
      id: "shipping",
      title: "Shipping",
      faqs: [
        ["How much is shipping?", `Free on orders over ${free}. Otherwise a flat ${formatMoneyShort(flatRate)}.`],
        ["How long does delivery take?", "Orders ship within 1–2 business days. Delivery usually takes 3–7 business days depending on where you are."],
        ["Do you ship worldwide?", "We ship to most countries across Europe, North America, the UK, Australia and parts of Asia. Available countries show at checkout."],
        ["Will I pay customs or import duties?", "Orders shipped outside the EU may be charged duties by your local customs office. These are the customer's responsibility."],
      ],
    },
    {
      id: "returns",
      title: "Returns & exchanges",
      faqs: [
        ["What's your return policy?", `Unworn items with tags attached can be returned within ${RETURN_WINDOW_DAYS} days of delivery for a full refund.`],
        ["How do I start a return?", <>From your <Link href="/account" className="underline">account</Link> (open the order → Start a return) or via <Link href="/track" className="underline">order tracking</Link> if you checked out as a guest.</>],
        ["Can I exchange for a different size?", "Return the item for a refund and place a new order — that's the fastest way to get the right size before it sells out."],
        ["When do I get my refund?", "As soon as your return arrives and is checked, usually within 3 business days. Your bank may take 5–10 days to show it."],
      ],
    },
    {
      id: "payments",
      title: "Payments & promotions",
      faqs: [
        ["Which payment methods do you accept?", "All major cards, Apple Pay, Google Pay and local methods like iDEAL, shown at checkout. Payments are processed securely by Stripe."],
        ["How do I use a discount code?", "Enter it in the promotion code field on the checkout page."],
        ["How do gift cards work?", <>Enter the code in your bag before checkout. Any remaining balance stays on the card. <Link href="/gift-cards" className="underline">Buy a gift card</Link>.</>],
      ],
    },
    {
      id: "products",
      title: "Products & drops",
      faqs: [
        ["Will sold-out items come back?", "Some do. Hit “Notify me” on the product page and we'll email you if your size returns."],
        ["How do drops work?", <>Drops are limited runs released at a set time. See what&apos;s next on <Link href="/drops" className="underline">upcoming drops</Link> and sign up for an alert.</>],
        ["How should I care for my pieces?", "Wash cold, inside out. Don't tumble dry. Iron on the reverse, avoiding the print."],
      ],
    },
  ];

  return (
    <>
      <PageHeader eyebrow="We've got you" title="Help centre" />
      <div className="container-x section-y">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, title: "Track an order", href: "/track" },
            { icon: RefreshCw, title: "Start a return", href: "/track" },
            { icon: Ruler, title: "Size guide", href: "#sizing" },
            { icon: Mail, title: "Contact us", href: "/help/contact" },
          ].map((c) => (
            <Link key={c.title} href={c.href} className="group flex items-center justify-between bg-white p-6 hover:bg-ink hover:text-white">
              <span className="flex items-center gap-4">
                <c.icon className="size-6" strokeWidth={1.3} />
                <span className="text-[13px] font-semibold tracking-[0.12em] uppercase">{c.title}</span>
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Help topics" className="hidden lg:block">
            <ul className="sticky top-32 space-y-3 text-[14px]">
              {sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="hover:underline underline-offset-4">{s.title}</a></li>
              ))}
              <li><a href="#sizing" className="hover:underline underline-offset-4">Sizing</a></li>
            </ul>
          </nav>
          <div className="space-y-16">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-32">
                <h2 className="font-display text-3xl font-[900] uppercase">{s.title}</h2>
                <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
                  {s.faqs.map(([q, a]) => (
                    <details key={q} className="group py-5">
                      <summary className="flex items-center justify-between gap-6 text-[16px] font-medium">
                        {q}
                        <Plus className="rotate-open size-5 shrink-0 transition-transform" strokeWidth={1.3} />
                      </summary>
                      <div className="pt-3 text-[15px] leading-relaxed text-black/75">{a}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
            <section id="sizing" className="scroll-mt-32">
              <h2 className="font-display text-3xl font-[900] uppercase">Sizing</h2>
              <div className="mt-6 grid gap-10 xl:grid-cols-2">
                {Object.entries(SIZE_GUIDES).map(([cat, chart]) => (
                  <div key={cat}>
                    <h3 className="label mb-3 font-semibold">{cat.replace("-", " ")}</h3>
                    <SizeGuideTable chart={chart} />
                  </div>
                ))}
              </div>
            </section>
            <div className="bg-ink p-10 text-white">
              <h2 className="font-display text-3xl font-[900] uppercase">Still need help?</h2>
              <p className="mt-3 text-white/75">We reply within one business day.</p>
              <Link href="/help/contact" className="btn-outline mt-6">Contact us <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
