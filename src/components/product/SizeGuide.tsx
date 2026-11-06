"use client";

import { useEffect, useRef, useState } from "react";
import { Ruler, X } from "lucide-react";
import { useT } from "../Prefs";
import type { MessageKey } from "@/i18n/messages";

export type SizeChart = { note: string; columns: string[]; rows: (string | number)[][] };

export function SizeGuideTable({ chart, category }: { chart: SizeChart; category?: string }) {
  const t = useT();
  // Column names and notes are translated when a translation exists.
  const tr = (key: string, fallback: string) => {
    const v = t(key as MessageKey);
    return v === key ? fallback : v;
  };
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink">
              {chart.columns.map((c) => (
                <th key={c} className="py-3 pr-4 text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {tr(`sg.${c}`, c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r) => (
              <tr key={String(r[0])} className="border-b border-black/10">
                {r.map((v, i) => (
                  <td key={i} className={`py-3 pr-4 tabular-nums ${i === 0 ? "font-semibold" : ""}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-black/70">{category ? tr(`sg.note.${category}`, chart.note) : chart.note}</p>
    </div>
  );
}

export function SizeGuide({ chart, productName, category }: { chart: SizeChart; productName: string; category?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-[12px] underline underline-offset-4">
        <Ruler className="size-4" strokeWidth={1.5} /> {t("size.guide")}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        className="m-auto w-[min(640px,calc(100vw-32px))] bg-white p-0 backdrop:bg-black/50"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-ash">{t("size.guide")}</p>
              <h2 className="mt-2 text-xl font-semibold">{productName}</h2>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("size.close")}>
              <X className="size-5" />
            </button>
          </div>
          <SizeGuideTable chart={chart} category={category} />
          <p className="mt-4 text-xs text-ash">
            {t("size.between")}
          </p>
        </div>
      </dialog>
    </>
  );
}
