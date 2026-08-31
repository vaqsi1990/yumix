import {
  RESTAURANT_CATEGORY_DEFS,
  getCategoryKeywords as getDefCategoryKeywords,
  getSubcategoryKeywords as getDefSubcategoryKeywords,
} from "./restaurant-categories";

export type PublicSubcategory = {
  slug: string;
  label: string;
  href: string;
};

export type PublicCategory = {
  slug: string;
  href: string;
  label: string;
  image: string | null;
  description: string;
  subcategories: PublicSubcategory[];
};

function toPublicSubcategory(
  categorySlug: string,
  sub: { slug: string; label: string },
): PublicSubcategory {
  return {
    slug: sub.slug,
    label: sub.label,
    href: `/categories/${categorySlug}?sub=${sub.slug}`,
  };
}

function toPublicCategory(
  category: typeof RESTAURANT_CATEGORY_DEFS[number],
): PublicCategory {
  return {
    slug: category.slug,
    href: `/categories/${category.slug}`,
    label: category.label,
    image: category.image,
    description: category.description,
    subcategories: category.subcategories.map((sub) =>
      toPublicSubcategory(category.slug, sub),
    ),
  };
}

const HOME_CATEGORY_COUNT = 8;

export const PUBLIC_CATEGORIES: PublicCategory[] = RESTAURANT_CATEGORY_DEFS.map(
  toPublicCategory,
);

/** Featured subset on the home page; full list on /categories */
export const HOME_CATEGORIES: PublicCategory[] = PUBLIC_CATEGORIES.slice(
  0,
  HOME_CATEGORY_COUNT,
);

export function getCategoryBySlug(slug: string) {
  return PUBLIC_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getSubcategoryBySlug(categorySlug: string, subSlug: string) {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.subcategories.find((sub) => sub.slug === subSlug) ?? null;
}

export function getPublicCategories(query?: string) {
  const q = query?.trim().toLowerCase();
  if (!q) return PUBLIC_CATEGORIES;

  return PUBLIC_CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.subcategories.some(
        (sub) =>
          sub.label.toLowerCase().includes(q) ||
          sub.slug.toLowerCase().includes(q),
      ),
  );
}

export function getCategoryKeywords(slug: string, subSlug?: string): string[] {
  if (subSlug) {
    return getDefSubcategoryKeywords(slug, subSlug);
  }
  return getDefCategoryKeywords(slug);
}
