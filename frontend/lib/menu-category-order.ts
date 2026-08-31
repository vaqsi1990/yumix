export const STANDARD_MENU_CATEGORIES = [
  { name: "ძირითადი კერძები", aliases: ["საჭმელ", "ცხელი კერძ", "main"] },
  { name: "ცომეული", aliases: ["ცომეულ", "პიცა", "ხაჭაპურ", "pizza"] },
  {
    name: "აპეტაიზერი",
    aliases: ["აპეტაიზ", "სნექ", "snack", "appetizer", "starter"],
  },
  { name: "სალათები", aliases: ["სალათ", "salad"] },
  { name: "პასტა", aliases: ["პასტ", "pasta"] },
  { name: "წვნიანი", aliases: ["წვნიან", "სუპ", "soup"] },
  { name: "გარნირი", aliases: ["გარნირ", "garnish", "side"] },
  { name: "სოუსები", aliases: ["სოუს", "sauce"] },
  { name: "დესერტი", aliases: ["დესერტ", "dessert", "ტკბილ", "ტორტ", "cake"] },
  {
    name: "სასმელები",
    aliases: ["სასმელ", "drink", "beverage", "ყავა", "ჩაი", "წვენი", "ლიმონათი", "cola", "coffee", "juice"],
  },
] as const;

export function isStandardMenuCategory(name: string) {
  return STANDARD_MENU_CATEGORIES.some((category) => category.name === name);
}

export function matchStandardMenuCategory(name: string) {
  const trimmed = name.trim();
  const exact = STANDARD_MENU_CATEGORIES.find(
    (category) => category.name === trimmed,
  );
  if (exact) return exact;

  const hay = trimmed.toLowerCase();
  return (
    STANDARD_MENU_CATEGORIES.find((category) =>
      category.aliases.some((alias) => hay.includes(alias.toLowerCase())),
    ) ?? null
  );
}

export function menuCategoryRank(name: string) {
  const matched = matchStandardMenuCategory(name);
  if (!matched) return STANDARD_MENU_CATEGORIES.length;
  return STANDARD_MENU_CATEGORIES.findIndex(
    (category) => category.name === matched.name,
  );
}

export function sortMenuCategories<T extends { name: string; sortOrder?: number }>(
  categories: T[],
) {
  return [...categories].sort((a, b) => {
    const rankA = menuCategoryRank(a.name);
    const rankB = menuCategoryRank(b.name);
    if (rankA !== rankB) return rankA - rankB;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function onlyStandardMenuCategories<
  T extends { name: string; sortOrder?: number },
>(categories: T[]) {
  return sortMenuCategories(
    categories.filter((category) => isStandardMenuCategory(category.name)),
  );
}
