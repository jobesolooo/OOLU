import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TrackView } from "./TrackView";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("track.meta") };
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
