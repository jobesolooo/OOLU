/** One tile size for both social carousels: same shape, exactly 2 (phone) or 3 (wider) whole tiles in view. */
export const SOCIAL_TILE =
  "group relative aspect-[3/4] w-[calc((100%-12px)/2)] shrink-0 snap-start overflow-hidden bg-ink sm:w-[calc((100%-24px)/3)]";
/** Small platform badge in the top-right corner, identical on both sides. */
export const SOCIAL_BADGE = "absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm";
