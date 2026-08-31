export const PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export type ProductSizeVariant = {
  id?: string;
  name: string;
  price: number;
};

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

export function sizePricesFromVariants(
  variants: ProductSizeVariant[],
): Partial<Record<ProductSize, number>> {
  const prices: Partial<Record<ProductSize, number>> = {};
  for (const variant of variants) {
    const name = variant.name.trim();
    if (isProductSize(name) && variant.price > 0) {
      prices[name] = variant.price;
    }
  }
  return prices;
}

export function variantsFromSizePrices(
  prices: Partial<Record<ProductSize, number>>,
  existing: ProductSizeVariant[] = [],
): ProductSizeVariant[] {
  const idBySize = new Map(
    existing
      .filter((variant) => isProductSize(variant.name.trim()))
      .map((variant) => [variant.name.trim() as ProductSize, variant.id]),
  );

  return PRODUCT_SIZES.filter((size) => (prices[size] ?? 0) > 0).map(
    (size) => ({
      ...(idBySize.get(size) ? { id: idBySize.get(size) } : {}),
      name: size,
      price: prices[size]!,
    }),
  );
}

export function normalizeProductVariants(
  variants: ProductSizeVariant[],
): ProductSizeVariant[] {
  return sortVariantsBySize(
    variants
      .filter(
        (variant) =>
          isProductSize(variant.name.trim()) && variant.price > 0,
      )
      .map((variant) => ({
        ...variant,
        name: variant.name.trim() as ProductSize,
      })),
  );
}
