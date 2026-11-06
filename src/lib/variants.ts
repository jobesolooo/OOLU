/** Shared (client + server) helpers for colour/size variants. */
export type ColorOption = { name: string; hex: string };

export const variantKey = (size: string, color?: string | null) => (color ? `${color} / ${size}` : size);

/** Human label for a cart line / order item, e.g. "Beige · M" or "M". */
export const variantLabel = (key: string) => key.replace(" / ", " · ");

/** Every purchasable key for a product. */
export function allVariantKeys(p: { sizes: string[]; colors: ColorOption[]; variants?: string[] | null }) {
  if (!p.colors.length) return p.sizes;
  if (p.variants?.length) return p.variants;
  return p.colors.flatMap((c) => p.sizes.map((s) => variantKey(s, c.name)));
}
