import { STANDARD_MENU_CATEGORIES } from "./menu-category-order";
import {
  CATEGORY_SUBCATEGORIES,
  type CategorySubcategoryDef,
} from "./category-subcategories";

export type RestaurantCategoryDef = {
  slug: string;
  label: string;
  keywords: string[];
  description: string;
  image: string | null;
  subcategories: CategorySubcategoryDef[];
};

const CATEGORY_META: Record<
  string,
  { slug: string; description: string; image: string | null }
> = {
  ქართული: {
    slug: "georgian",
    description: "ტრადიციული ქართული კერძები",
    image: "/cat/4.png",
  },
  უცხოური: {
    slug: "foreign",
    description: "უცხოური და ანტონომიური კერძები",
    image: "/cat/3.png",
  },
  "სწრაფი კვება": {
    slug: "fast-food",
    description: "ბურგერები, შაურმა და ფასთფუდი",
    image: "/cat/2.png",
  },
  გამომცხვრები: {
    slug: "bakery",
    description: "პიცა, ცომეული და გამომცხვრები",
    image: "/cat/1.png",
  },
  "ზღვის პროდუქტები": {
    slug: "seafood",
    description: "თევზი და ზღვის პროდუქტები",
    image: null,
  },
  სალათები: {
    slug: "salads",
    description: "ახალი და ჯანსაღი სალათები",
    image: "/cat/5.png",
  },
  სუპები: {
    slug: "soups",
    description: "ცხელი სუპები და ბულიონები",
    image: "/cat/6.png",
  },
  დესერტები: {
    slug: "desserts",
    description: "ტკბილეული და დესერტები",
    image: "/cat/7.png",
  },
  საუზმე: {
    slug: "breakfast",
    description: "საუზმის კერძები",
    image: null,
  },
  "ჯანსაღი კვება": {
    slug: "healthy",
    description: "ჯანსაღი და ბალანსირებული კერძები",
    image: null,
  },
  ვეგეტარიანული: {
    slug: "vegetarian",
    description: "ვეგეტარიანული და ვეგანური მენიუ",
    image: null,
  },
  სნექები: {
    slug: "snacks",
    description: "სნექები და აპეტაიზერები",
    image: null,
  },
  სასმელები: {
    slug: "drinks",
    description: "ცივი და ცხელი სასმელები",
    image: "/cat/8.png",
  },
  სოუსები: {
    slug: "sauces",
    description: "სოუსები და დამატებები",
    image: null,
  },
};

/** Shop and admin food categories (aligned with menu sections) */
export const RESTAURANT_CATEGORY_DEFS: RestaurantCategoryDef[] =
  STANDARD_MENU_CATEGORIES.map((category) => {
    const meta = CATEGORY_META[category.name];
    return {
      slug: meta.slug,
      label: category.name,
      keywords: [...category.aliases, category.name],
      description: meta.description,
      image: meta.image,
      subcategories: CATEGORY_SUBCATEGORIES[meta.slug] ?? [],
    };
  });

export const RESTAURANT_CATEGORIES = RESTAURANT_CATEGORY_DEFS.map(
  (c) => c.label,
) as readonly string[];

export function getCategoryDefBySlug(slug: string) {
  return RESTAURANT_CATEGORY_DEFS.find((c) => c.slug === slug) ?? null;
}

export function getCategoryKeywords(slug: string): string[] {
  const def = getCategoryDefBySlug(slug);
  if (!def) return [slug];
  return [...def.keywords, def.label];
}

export function getSubcategoryKeywords(
  categorySlug: string,
  subSlug: string,
): string[] {
  const def = getCategoryDefBySlug(categorySlug);
  if (!def) return [subSlug];
  const sub = def.subcategories.find((s) => s.slug === subSlug);
  if (!sub) return [subSlug];
  return [sub.label, ...def.keywords];
}
