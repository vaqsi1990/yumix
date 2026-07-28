export type PublicCategory = {
  slug: string;
  href: string;
  label: string;
  image: string | null;
  description: string;
};

export const PUBLIC_CATEGORIES: PublicCategory[] = [
  {
    slug: "pizza",
    href: "/categories/pizza",
    label: "პიცა",
    image: "/cat/1.png",
    description: "იტალიური და ამერიკული პიცა",
  },
  {
    slug: "burger",
    href: "/categories/burger",
    label: "ბურგერი",
    image: "/cat/2.png",
    description: "ბურგერები და ფასთფუდი",
  },
  {
    slug: "sushi",
    href: "/categories/sushi",
    label: "სუში",
    image: "/cat/3.png",
    description: "სუში და აზიური კერძები",
  },
  {
    slug: "georgian",
    href: "/categories/georgian",
    label: "ქართული სამზარეულო",
    image: "/cat/4.png",
    description: "ტრადიციული ქართული კერძები",
  },
  {
    slug: "salads",
    href: "/categories/salads",
    label: "სალათები",
    image: "/cat/5.png",
    description: "ახალი და ჯანსაღი სალათები",
  },
  {
    slug: "soups",
    href: "/categories/soups",
    label: "სუპები",
    image: "/cat/6.png",
    description: "ცხელი სუპები და ბულიონები",
  },
  {
    slug: "desserts",
    href: "/categories/desserts",
    label: "დესერტები",
    image: "/cat/7.png",
    description: "ტკბილეული და დესერტები",
  },
  {
    slug: "drinks",
    href: "/categories/drinks",
    label: "სასმელები",
    image: "/cat/8.png",
    description: "ცივი და ცხელი სასმელები",
  },
  {
    slug: "other",
    href: "/categories/other",
    label: "სხვა",
    image: null,
    description: "სხვა კატეგორიები",
  },
];

export function getCategoryBySlug(slug: string) {
  return PUBLIC_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getPublicCategories(query?: string) {
  const q = query?.trim().toLowerCase();
  if (!q) return PUBLIC_CATEGORIES;

  return PUBLIC_CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q),
  );
}
