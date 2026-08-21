export type FoodTasteCategory = {
  slug: string;
  label: string;
  keywords: string[];
};

/** Cuisine / dish types used to learn taste from order history. */
export const FOOD_TASTE_CATEGORIES: FoodTasteCategory[] = [
  { slug: 'pizza', label: 'პიცა', keywords: ['პიც', 'pizza'] },
  { slug: 'burger', label: 'ბურგერი', keywords: ['ბურგერ', 'burger'] },
  { slug: 'sushi', label: 'სუში', keywords: ['სუში', 'sushi'] },
  { slug: 'khinkali', label: 'ხინკალი', keywords: ['ხინკ', 'khinkali'] },
  { slug: 'khachapuri', label: 'ხაჭაპური', keywords: ['ხაჭაპურ', 'khachapuri'] },
  { slug: 'georgian', label: 'ქართული', keywords: ['ქართულ', 'georgian'] },
  { slug: 'salad', label: 'სალათი', keywords: ['სალათ', 'salad'] },
  { slug: 'soup', label: 'სუპი', keywords: ['სუპ', 'soup'] },
  { slug: 'dessert', label: 'დესერტი', keywords: ['დესერტ', 'dessert', 'ტკბილ'] },
  { slug: 'drink', label: 'სასმელი', keywords: ['სასმელ', 'drink', 'ყავ', 'ჩაი'] },
  { slug: 'hotdog', label: 'ჰოთ-დოგი', keywords: ['ჰოთ-დოგ', 'hotdog', 'hot dog'] },
  { slug: 'pasta', label: 'პასტა', keywords: ['პასტ', 'pasta'] },
  { slug: 'chicken', label: 'ქათამი', keywords: ['ქათმ', 'chicken'] },
  { slug: 'kebab', label: 'კებაბი', keywords: ['კებაბ', 'kebab'] },
  { slug: 'asian', label: 'აზიური', keywords: ['აზიურ', 'asian'] },
  { slug: 'italian', label: 'იტალიური', keywords: ['იტალიურ', 'italian'] },
  { slug: 'bbq', label: 'ბარბეკიუ', keywords: ['ბარბეკიუ', 'bbq'] },
  { slug: 'snacks', label: 'სნექები', keywords: ['სნექ', 'snack'] },
];

const CATEGORY_BY_SLUG = new Map(
  FOOD_TASTE_CATEGORIES.map((category) => [category.slug, category]),
);

export function collectTasteSlugs(
  parts: Array<string | null | undefined>,
): string[] {
  const hay = parts.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return [];

  const slugs = new Set<string>();
  for (const category of FOOD_TASTE_CATEGORIES) {
    if (category.keywords.some((keyword) => hay.includes(keyword.toLowerCase()))) {
      slugs.add(category.slug);
    }
  }
  return [...slugs];
}

export function tasteKeywordsForSlugs(slugs: string[]): string[] {
  const keywords = new Set<string>();
  for (const slug of slugs) {
    const category = CATEGORY_BY_SLUG.get(slug);
    if (!category) {
      keywords.add(slug);
      continue;
    }
    keywords.add(category.slug);
    keywords.add(category.label);
    for (const keyword of category.keywords) keywords.add(keyword);
  }
  return [...keywords].filter(Boolean);
}

export function tasteLabel(slug: string) {
  return CATEGORY_BY_SLUG.get(slug)?.label ?? slug;
}
