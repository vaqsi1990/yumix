export const PRODUCT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export function isProductSize(name: string): name is ProductSize {
  return (PRODUCT_SIZES as readonly string[]).includes(name);
}

export function sortVariantsBySize<T extends { name: string }>(
  variants: T[],
): T[] {
  return [...variants].sort((a, b) => {
    const ai = PRODUCT_SIZES.indexOf(a.name as ProductSize);
    const bi = PRODUCT_SIZES.indexOf(b.name as ProductSize);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function sanitizeProductVariants(
  variants: { id?: string; name: string; price: number }[],
) {
  return sortVariantsBySize(
    variants
      .filter((variant) => isProductSize(variant.name.trim()) && variant.price > 0)
      .map((variant) => ({
        ...variant,
        name: variant.name.trim() as ProductSize,
      })),
  );
}
