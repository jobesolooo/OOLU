import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from "./icons";

export function Footer() {
  const [l1, l2] = site.tagline.split(". ");
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div
        className="absolute inset-0 bg-cover bg-bottom opacity-90"
        style={{ backgroundImage: `url(${site.footerImage})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="container-x relative grid gap-10 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:py-[clamp(32px,3.6vw,56px)]">
        <Logo divider />
        <p className="border-white/40 text-[11px] leading-[1.8] tracking-[0.22em] uppercase md:border-l md:pl-9">
          {l1}.<br />
          {l2}
        </p>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex items-center gap-5">
            <a href={site.social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
              <InstagramIcon className="size-[15px]" />
            </a>
            <a href={site.social.tiktok} aria-label="TikTok" target="_blank" rel="noreferrer">
              <TikTokIcon className="size-[15px]" />
            </a>
            <a href={site.social.youtube} aria-label="YouTube" target="_blank" rel="noreferrer">
              <YouTubeIcon className="size-[16px]" />
            </a>
            <a href={site.social.x} aria-label="X" target="_blank" rel="noreferrer">
              <XIcon className="size-[14px]" />
            </a>
          </div>
          <Link href="/account/register" className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase">
            Join the movement <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
