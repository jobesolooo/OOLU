import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container-x py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] text-ash uppercase">404</p>
      <h1 className="mt-3 font-display font-normal tracking-[-0.02em] text-5xl">{t("notFound.title")}</h1>
      <p className="mt-4 text-sm text-ash">{t("notFound.body")}</p>
      <Link href="/shop" className="btn-solid mt-8">{t("notFound.back")}</Link>
    </div>
  );
}
