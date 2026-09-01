export const STANDARD_MENU_CATEGORIES = [
  {
    name: "ქართული",
    aliases: [
      "ძირითადი კერძ",
      "ცხელი კერძ",
      "main",
      "georgian",
      "ქართულ",
      "ხინკ",
      "ხაჭაპ",
      "მწვად",
      "ქაბაბ",
      "ჩაქაფ",
      "ჩაშუშ",
      "ლობი",
      "ფხალ",
      "კუპატ",
      "ღომ",
      "ელარჯ",
      "საცივ",
      "ბაჟ",
    ],
  },
  {
    name: "უცხოური",
    aliases: [
      "პასტ",
      "pasta",
      "foreign",
      "international",
      "იტალიურ",
      "აზიურ",
      "იაპონ",
      "ჩინურ",
      "ამერიკ",
      "მექსიკ",
      "თურქ",
      "ინდურ",
      "ფრანგ",
      "ბერძნ",
      "ესპან",
      "არაბ",
      "sushi",
      "სუში",
    ],
  },
  {
    name: "სწრაფი კვება",
    aliases: [
      "გარნირ",
      "garnish",
      "side",
      "fast food",
      "ბურგერ",
      "burger",
      "შაურმ",
      "hot-dog",
      "ფრი",
      "nugget",
      "ჩიქენ",
      "sandwich",
      "სენდვიჩ",
      "ტაკო",
      "wrap",
      "რაპ",
    ],
  },
  {
    name: "კომბო მენიუ",
    aliases: ["combo menu", "combo", "კომბო", "კომბო მენიუ", "combo meal"],
  },
  {
    name: "გამომცხვრები",
    aliases: [
      "ცომეულ",
      "bakery",
      "პიც",
      "pizza",
      "კუბდარ",
      "ღვეზ",
      "კრუას",
      "croissant",
      "ფუნთ",
      "პური",
      "დონატ",
      "donut",
      "მაფინ",
      "muffin",
      "ბრაუნ",
      "brownie",
      "ბაგეტ",
    ],
  },
  {
    name: "ზღვის პროდუქტები",
    aliases: [
      "ზღვ",
      "seafood",
      "თევზ",
      "fish",
      "ორაგულ",
      "კალმარ",
      "squid",
      "კრევეტ",
      "shrimp",
      "მიდი",
      "ოქტოპ",
      "octopus",
      "კიბორჩხ",
    ],
  },
  { name: "სალათები", aliases: ["სალათ", "salad", "ცეზარ", "caesar", "poke"] },
  {
    name: "სუპები",
    aliases: ["წვნიან", "სუპ", "soup", "ხარჩ", "ჩიხირთ", "ramen", "რამენ"],
  },
  {
    name: "დესერტები",
    aliases: [
      "დესერტ",
      "dessert",
      "ტკბილ",
      "ტორტ",
      "cake",
      "ჩიზქეიქ",
      "cheesecake",
      "ნაყინ",
      "ice cream",
      "ტირამ",
      "tiramisu",
    ],
  },
  {
    name: "საუზმე",
    aliases: ["breakfast", "brunch", "ბრანჩ", "კვერცხ", "egg", "ომლეტ", "omelet", "ბლინ", "pancake", "გრანოლ", "granola"],
  },
  {
    name: "ჯანსაღი კვება",
    aliases: ["ჯანსაღ", "healthy", "ქინოა", "quinoa", "ჰუმუს", "hummus", "სმუზ", "smoothie", "პროტეინ"],
  },
  {
    name: "ვეგეტარიანული",
    aliases: ["ვეგეტარი", "vegetarian", "vegan", "ვეგან", "ფალაფელ", "falafel"],
  },
  {
    name: "სნექები",
    aliases: [
      "აპეტაიზ",
      "snack",
      "appetizer",
      "starter",
      "ჩიფს",
      "chips",
      "nachos",
      "ნაჩ",
      "პოპკორნ",
      "popcorn",
      "კრეკერ",
      "cracker",
    ],
  },
  {
    name: "სასმელები",
    aliases: ["სასმელ", "drink", "beverage", "ყავა", "ჩაი", "წვენი", "ლიმონათი", "cola", "coffee", "juice", "კოქტ", "cocktail"],
  },
  {
    name: "სოუსები",
    aliases: ["სოუს", "sauce", "კეტჩ", "ketchup", "მაიო", "mayo", "პესტ", "pesto", "აჯიკ", "ტყემალ"],
  },
] as const;

export const COMBO_MENU_CATEGORY_NAME = "კომბო მენიუ";

export function isComboMenuCategory(name: string) {
  const matched = matchStandardMenuCategory(name);
  return matched?.name === COMBO_MENU_CATEGORY_NAME;
}

export function findComboMenuCategoryId<
  T extends { id: string; name: string },
>(categories: T[]) {
  return categories.find((category) => isComboMenuCategory(category.name))?.id;
}

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

/** Sauces and drinks are configured as options/add-ons, not standalone menu sections. */
const AUXILIARY_MENU_CATEGORY_NAMES = new Set(["სოუსები", "სასმელები"]);

export function isAuxiliaryMenuCategory(name: string) {
  const matched = matchStandardMenuCategory(name);
  return matched != null && AUXILIARY_MENU_CATEGORY_NAMES.has(matched.name);
}

export function onlyCustomerMenuCategories<
  T extends { name: string; sortOrder?: number },
>(categories: T[]) {
  return sortMenuCategories(
    categories.filter(
      (category) =>
        isStandardMenuCategory(category.name) &&
        !isAuxiliaryMenuCategory(category.name),
    ),
  );
}
