import Image from "next/image";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { POSTERS } from "@/lib/posters";

export default async function NotFound() {
  const { t } = await getT();
  const poster = POSTERS.keepMovingGraffiti;
  return (
    <div className="container-x grid items-center gap-10 py-20 md:grid-cols-[1fr_minmax(0,340px)] lg:pr-10 md:gap-16 md:py-28">
      <div className="text-center md:text-left">
        <p className="text-[10px] tracking-[0.3em] text-ash uppercase">404</p>
        <h1 className="mt-3 font-display font-normal tracking-[-0.02em] text-5xl">{t("notFound.title")}</h1>
        <p className="mt-4 text-sm text-ash">{t("notFound.body")}</p>
        <Link href="/shop" className="btn-solid mt-8">{t("notFound.back")}</Link>
      </div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] rotate-[1.5deg] overflow-hidden shadow-[0_24px_50px_-20px_rgba(0,0,0,0.45)] md:max-w-none">
        <Image src={poster.src} alt={poster.alt} fill sizes="(min-width:768px) 380px, 300px" className="object-cover" />
      </div>
    </div>
  );
}
