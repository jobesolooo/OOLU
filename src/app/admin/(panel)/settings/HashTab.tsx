"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Old links like /admin/settings#keys-stripe open the tab that holds that section. */
const WHERE: [RegExp, string][] = [
  [/^#(keys|keys-.+)$/, "keys"],
  [/^#(email|biz-mail)$/, "email"],
  [/^#(signin|staff)$/, "signin"],
  [/^#homepage$/, "homepage"],
  [/^#guides$/, "guides"],
  [/^#(business|biz-.+)$/, "business"],
];

export function HashTab({ current }: { current: string }) {
  const router = useRouter();
  useEffect(() => {
    // On phones the tab row scrolls sideways: keep the open tab in view.
    document.querySelector('nav[aria-label="Settings sections"] [aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
    const hash = window.location.hash;
    const tab = WHERE.find(([re]) => re.test(hash))?.[1];
    if (tab && tab !== current) router.replace(`/admin/settings?tab=${tab}${hash}`);
    else if (hash) document.querySelector(hash)?.scrollIntoView({ block: "start" });
  }, [current, router]);
  return null;
}
