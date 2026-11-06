"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true after hydration; avoids SSR/localStorage mismatches without setState-in-effect. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
