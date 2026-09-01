export function productHasSelectableOptions(product: {
  customizationGroups?: { options?: unknown[] }[] | null;
}) {
  return (product.customizationGroups ?? []).some(
    (group) => (group.options?.length ?? 0) > 0,
  );
}

export function productNeedsDetailSheet(
  product: {
    customizationGroups?: { options?: unknown[] }[] | null;
  },
  hasRestaurantAddOns = false,
) {
  return hasRestaurantAddOns || productHasSelectableOptions(product);
}
