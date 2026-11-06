import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cx } from "@/lib/format";

/** Page title block used at the top of every admin page. */
export function AdminHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rise mb-[clamp(24px,3vw,40px)] flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-semibold tracking-[0.18em] text-[#6b54e0] uppercase">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-[clamp(34px,4vw,56px)] leading-[0.95] tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ash">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Pill-style filter tabs (each one is a link). */
export function Segmented({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex max-w-full overflow-x-auto px-1">
      <div className="flex shrink-0 gap-1 rounded-full bg-white p-1 ring-1 ring-black/5">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={i.active ? "page" : undefined}
            className={cx(
              "flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase transition-colors",
              i.active ? "bg-ink text-white" : "text-black/60 hover:bg-mist hover:text-ink",
            )}
          >
            {i.label}
            {i.count ? (
              <span className={cx("rounded-full px-1.5 py-px text-[10px] tabular-nums", i.active ? "bg-accent text-ink" : "bg-black/5")}>{i.count}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Headline number tile. `dark` gives the first tile of a row more weight. */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  sub,
  dark,
  href,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  sub?: string;
  dark?: boolean;
  href?: string;
  index?: number;
}) {
  const body = (
    <>
      {dark && <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-accent/30 blur-3xl" />}
      <p className={cx("relative text-[10px] font-semibold tracking-[0.14em] uppercase", dark ? "text-accent" : "text-ash")}>{label}</p>
      <p className="relative mt-3 font-wordmark text-[clamp(36px,3.4vw,52px)] leading-[0.85] tabular-nums">{value}</p>
      {delta != null && (
        <p
          className={cx(
            "relative mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] tabular-nums",
            delta >= 0 ? (dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-50 text-emerald-700") : dark ? "bg-rose-400/15 text-rose-300" : "bg-rose-50 text-rose-700",
          )}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%{deltaLabel && <span className="opacity-70"> {deltaLabel}</span>}
        </p>
      )}
      {sub && <p className={cx("relative mt-2 text-[12px]", dark ? "text-white/55" : "text-ash")}>{sub}</p>}
      {href && <ArrowUpRight aria-hidden className="absolute top-4 right-4 size-4 opacity-0 transition-opacity group-hover:opacity-60" strokeWidth={1.5} />}
    </>
  );
  const cls = cx(
    "rise group relative isolate overflow-hidden p-5 sm:p-6",
    dark ? "bg-ink text-white" : "bg-white ring-1 ring-black/5",
    href && "transition-transform duration-300 hover:-translate-y-0.5",
  );
  const style = { "--delay": `${index * 60}ms` } as React.CSSProperties;
  return href ? (
    <Link href={href} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/** White card with an optional title row. */
export function Panel({
  title,
  action,
  children,
  className,
  flush,
}: {
  title?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cx("bg-white ring-1 ring-black/5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 sm:px-6">
          {title && <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase">{title}</h2>}
          {action && (
            <Link href={action.href} className="group flex items-center gap-1 text-[11px] text-ash transition-colors hover:text-ink">
              {action.label}
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      )}
      <div className={flush ? undefined : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/** Shared table classes so every admin table looks the same. */
export const table = {
  wrap: "overflow-x-auto bg-white ring-1 ring-black/5",
  table: "w-full text-left text-[13px]",
  head: "border-b border-black/10 bg-mist/60 text-[10px] tracking-[0.14em] text-ash uppercase [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium",
  body: "divide-y divide-black/5 [&_td]:px-4 [&_td]:py-3.5 [&>tr]:transition-colors [&>tr:hover]:bg-mist/70",
};

/** Small ghost button used for secondary actions. */
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 border border-black/15 bg-white px-4 py-2.5 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-ink";
