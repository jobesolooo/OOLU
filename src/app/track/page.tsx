import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TrackView } from "./TrackView";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Track your order" />
      <div className="container-x section-y">
        <TrackView />
      </div>
    </>
  );
}
