export const ADDON_CATEGORIES = ['FOOD', 'DRINK'] as const;
export type AddonCategory = (typeof ADDON_CATEGORIES)[number];

export const ADDON_CATEGORY_LABELS: Record<AddonCategory, string> = {
  FOOD: 'დამატებითი კერძები',
  DRINK: 'სასმელები',
};

export function parseAddonCategory(value: unknown): AddonCategory {
  return value === 'DRINK' ? 'DRINK' : 'FOOD';
}

export const ADDON_CARRIER_PRODUCT_NAME = '__YUMIX_EXTRA__';
