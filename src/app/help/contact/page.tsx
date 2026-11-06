import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { InstagramIcon } from "@/components/icons";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Contact us" />
      <div className="container-x section-y grid gap-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8 text-[15px] leading-relaxed text-black/75">
          <p>Questions about an order, sizing or a collab? Send a message and we&apos;ll reply within one business day (Mon–Fri).</p>
          <p>
            Quick answers live in the <Link href="/help" className="underline">help centre</Link>. To check an order, use{" "}
            <Link href="/track" className="underline">order tracking</Link>.
          </p>
          <a href={site.social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-ink">
            <InstagramIcon className="size-5" /> DM us on Instagram
          </a>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
