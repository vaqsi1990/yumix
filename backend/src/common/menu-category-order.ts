/** Public restaurant menu: food → dessert → snacks → drinks. */
const MENU_GROUP_KEYWORDS: { rank: number; keywords: string[] }[] = [
  {
    rank: 3,
    keywords: [
      'სასმელ',
      'drink',
      'ყავ',
      'ჩაი',
      'coffee',
      'tea',
      'cocktail',
      'კოქტ',
    ],
  },
  { rank: 2, keywords: ['სნექ', 'snack'] },
  {
    rank: 1,
    keywords: [
      'დესერტ',
      'dessert',
      'ტკბილ',
      'ტორტ',
      'cake',
      'ice cream',
      'ყინულ',
    ],
  },
  { rank: 4, keywords: ['სოუს', 'sauce'] },
];

export function menuCategoryRank(text: string) {
  const hay = text.toLowerCase();
  for (const group of MENU_GROUP_KEYWORDS) {
    if (group.keywords.some((keyword) => hay.includes(keyword.toLowerCase()))) {
      return group.rank;
    }
  }
  return 0;
}

export function sortMenuCategories<T extends { name: string; sortOrder?: number }>(
  categories: T[],
  extraText?: (category: T) => string,
) {
  return [...categories].sort((a, b) => {
    const rankA = menuCategoryRank(
      [a.name, extraText?.(a) ?? ''].filter(Boolean).join(' '),
    );
    const rankB = menuCategoryRank(
      [b.name, extraText?.(b) ?? ''].filter(Boolean).join(' '),
    );
    if (rankA !== rankB) return rankA - rankB;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
