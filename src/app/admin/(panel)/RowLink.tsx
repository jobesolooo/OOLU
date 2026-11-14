"use client";

import { useRouter } from "next/navigation";

/**
 * A table row that opens `href` when clicked anywhere on it. (A stretched link inside a <tr>
 * isn't contained by the row in every browser, which made every row open the first one.)
 * Keep a real <Link> in the first cell for keyboard users; Ctrl/⌘-click opens a new tab.
 */
export function RowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <tr
      className={`cursor-pointer ${className ?? ""}`}
      onMouseEnter={() => router.prefetch(href)}
      onClick={(e) => {
        // Let real links, buttons and form controls inside the row do their own thing.
        if ((e.target as HTMLElement).closest("a, button, input, select, textarea, label")) return;
        if (window.getSelection()?.toString()) return; // selecting text, not clicking
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
