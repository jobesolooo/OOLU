import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TrackView } from "./TrackView";
import { getT } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMeta({ path: "/track", title: t("track.meta"), description: "Track your OOLU order with your order number and email address." });
}

export default async function TrackPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader eyebrow={t("track.eyebrow")} title={t("track.title")} />
      <div className="container-x section-y">
        <TrackView />
      </div>
    </>
  );
}
