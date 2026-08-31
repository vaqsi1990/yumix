export type AddonCategory = "FOOD" | "DRINK";

export const ADDON_CATEGORY_LABELS: Record<AddonCategory, string> = {
  FOOD: "დამატებითი კერძები",
  DRINK: "სასმელები",
};

export const ADDON_CATEGORY_SHORT: Record<AddonCategory, string> = {
  FOOD: "+ კერძები",
  DRINK: "+ სასმელები",
};

export const ADDON_CARRIER_PRODUCT_NAME = "__YUMIX_EXTRA__";

export function parseAddonCategory(value: unknown): AddonCategory {
  return value === "DRINK" ? "DRINK" : "FOOD";
}

export function groupAddonsByCategory<T extends { category?: AddonCategory }>(
  addOns: T[],
) {
  const food = addOns.filter((a) => (a.category ?? "FOOD") === "FOOD");
  const drink = addOns.filter((a) => a.category === "DRINK");
  return { food, drink };
}
