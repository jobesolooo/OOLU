import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Full-size empty state for admin tables and lists, so a table keeps its
 * presence (and the page its height) before there's any data.
 */
export function AdminEmpty({
  icon: Icon,
  title,
  body,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; href: string; external?: boolean };
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "min-h-[clamp(220px,28vh,320px)] py-10" : "min-h-[clamp(320px,46vh,560px)] py-16"}`}>
      <span className="grid size-16 place-items-center rounded-full border border-black/10 bg-mist">
        <Icon className="size-7 text-ash" strokeWidth={1.3} />
      </span>
      <p className="mt-6 font-display font-normal tracking-[-0.02em] text-[clamp(20px,1.6vw,26px)]">{title}</p>
      {body && <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ash">{body}</p>}
      {action &&
        (action.external ? (
          <a href={action.href} target="_blank" rel="noreferrer" className="btn-solid mt-6">
            {action.label}
          </a>
        ) : (
          <Link href={action.href} className="btn-solid mt-6">
            {action.label}
          </Link>
        ))}
    </div>
  );
}

/** Use inside a <tbody> so the table header stays and the empty state spans all columns. */
export function EmptyRow({ colSpan, ...props }: Parameters<typeof AdminEmpty>[0] & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <AdminEmpty {...props} />
      </td>
    </tr>
  );
}
