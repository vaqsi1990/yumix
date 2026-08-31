export type RestaurantCategoryDef = {
  slug: string;
  label: string;
  keywords: string[];
  description: string;
  image: string | null;
};

/** Wolt-style food type categories (Georgian labels) */
export const RESTAURANT_CATEGORY_DEFS: RestaurantCategoryDef[] = [
  { slug: "cafe", label: "კაფე", keywords: ["კაფე", "cafe"], description: "კაფე", image: "/cat/8.png" },
  { slug: "breakfast", label: "საუზმე", keywords: ["საუზმე", "breakfast"], description: "საუზმის კერძები", image: null },
  { slug: "brunch", label: "ბრანჩი", keywords: ["ბრანჩი", "brunch"], description: "ბრანჩის მენიუ", image: null },
  { slug: "dessert", label: "დესერტი", keywords: ["დესერტ", "dessert"], description: "ტკბილეული და დესერტები", image: "/cat/7.png" },
  { slug: "bakery", label: "ცხობა", keywords: ["ცხობ", "bakery", "პური"], description: "ცხობა და ცხმები", image: null },
  { slug: "pizza", label: "პიცა", keywords: ["პიც", "pizza"], description: "იტალიური და ამერიკული პიცა", image: "/cat/1.png" },
  { slug: "burger", label: "ბურგერი", keywords: ["ბურგერ", "burger"], description: "ბურგერები და ფასთფუდი", image: "/cat/2.png" },
  { slug: "sandwich", label: "სენდვიჩი", keywords: ["სენდვიჩ", "sandwich"], description: "სენდვიჩები", image: null },
  { slug: "asian", label: "აზიური", keywords: ["აზიურ", "asian"], description: "აზიური სამზარეულო", image: null },
  { slug: "chinese", label: "ჩინური", keywords: ["ჩინურ", "chinese"], description: "ჩინური კერძები", image: null },
  { slug: "japanese", label: "იაპონური", keywords: ["იაპონურ", "japanese"], description: "იაპონური სამზარეულო", image: null },
  { slug: "thai", label: "ტაილური", keywords: ["ტაილურ", "thai"], description: "ტაილური კერძები", image: null },
  { slug: "korean", label: "კორეული", keywords: ["კორეულ", "korean"], description: "კორეული სამზარეულო", image: null },
  { slug: "indian", label: "ინდური", keywords: ["ინდურ", "indian", "კარ"], description: "ინდური კერძები", image: null },
  { slug: "american", label: "ამერიკული", keywords: ["ამერიკულ", "american"], description: "ამერიკული სამზარეულო", image: null },
  { slug: "middle-eastern", label: "ახლო აღმოსავლური", keywords: ["აღმოსავლ", "middle eastern"], description: "ახლო აღმოსავლური კერძები", image: null },
  { slug: "european", label: "ევროპული", keywords: ["ევროპულ", "european"], description: "ევროპული სამზარეულო", image: null },
  { slug: "mexican", label: "მექსიკური", keywords: ["მექსიკურ", "mexican"], description: "მექსიკური კერძები", image: null },
  { slug: "healthy", label: "ჯანსაღი", keywords: ["ჯანსაღ", "healthy"], description: "ჯანსაღი კერძები", image: null },
  { slug: "vegan", label: "ვეგანური", keywords: ["ვეგან", "vegan"], description: "ვეგანური კერძები", image: null },
  { slug: "vegetarian", label: "ვეგეტარიანული", keywords: ["ვეგეტარი", "vegetarian"], description: "ვეგეტარიანული მენიუ", image: null },
  { slug: "halal", label: "ჰალალი", keywords: ["ჰალალ", "halal"], description: "ჰალალი სამზარეულო", image: null },
  { slug: "bbq", label: "ბარბეკიუ", keywords: ["ბარბეკიუ", "bbq", "grill"], description: "ბარბეკიუ", image: null },
  { slug: "chicken", label: "ქათმის", keywords: ["ქათმ", "chicken"], description: "ქათმის კერძები", image: null },
  { slug: "seafood", label: "ზღვის პროდუქტები", keywords: ["ზღვ", "seafood"], description: "ზღვის პროდუქტები", image: null },
  { slug: "sushi", label: "სუში", keywords: ["სუში", "sushi"], description: "სუში და როლები", image: "/cat/3.png" },
  { slug: "noodles", label: "ნუდლი", keywords: ["ნუდლ", "noodle", "ramen"], description: "ნუდლი", image: null },
  { slug: "curry", label: "Curry", keywords: ["curry", "კარ"], description: "Curry კერძები", image: null },
  { slug: "soup", label: "სუპი", keywords: ["სუპ", "soup"], description: "ცხელი სუპები", image: "/cat/6.png" },
  { slug: "salad", label: "სალათები", keywords: ["სალათ", "salad"], description: "ახალი სალათები", image: "/cat/5.png" },
  { slug: "dumplings", label: "დამპლინგები", keywords: ["დამპლინგ", "dumpling"], description: "დამპლინგები", image: null },
  { slug: "falafel", label: "ფალაფელი", keywords: ["ფალაფელ", "falafel"], description: "ფალაფელი", image: null },
  { slug: "italian", label: "იტალიური", keywords: ["იტალიურ", "italian"], description: "იტალიური სამზარეულო", image: null },
  { slug: "cakes", label: "ტორტები", keywords: ["ტორტ", "cake"], description: "ტორტები", image: null },
  { slug: "ice-cream", label: "ყინული", keywords: ["ყინულ", "ice cream"], description: "ყინული", image: null },
  { slug: "fish", label: "თევზი", keywords: ["თევზ", "fish"], description: "თევზის კერძები", image: null },
  { slug: "kebab", label: "კებაბი", keywords: ["კებაბ", "kebab"], description: "კებაბი", image: null },
  { slug: "georgian", label: "ქართული", keywords: ["ქართულ", "georgian", "ტრადიციულ"], description: "ტრადიციული ქართული კერძები", image: "/cat/4.png" },
  { slug: "wraps", label: "რაფები", keywords: ["რაფ", "wrap"], description: "რაფები", image: null },
  { slug: "bowl", label: "ბოული", keywords: ["ბოულ", "bowl"], description: "ბოულები", image: null },
  { slug: "coffee-tea", label: "ყავა და ჩაი", keywords: ["ყავ", "ჩაი", "coffee", "tea"], description: "ყავა, ჩაი და სასმელები", image: "/cat/8.png" },
  { slug: "ukrainian", label: "უკრაინული", keywords: ["უკრაინ", "ukrainian"], description: "უკრაინული სამზარეულო", image: null },
  { slug: "asian-soup", label: "აზიური სუპი", keywords: ["აზიურ", "სუპ"], description: "აზიური სუპები", image: null },
  { slug: "central-asian", label: "ცენტრალურ-აზიური", keywords: ["ცენტრალ", "central asian"], description: "ცენტრალურ-აზიური კერძები", image: null },
  { slug: "khinkali", label: "ხინკალი", keywords: ["ხინკ", "khinkali"], description: "ხინკალი და ხაჩაფური", image: null },
  { slug: "khachapuri", label: "ხაჭაპური", keywords: ["ხაჭაპურ", "khachapuri"], description: "ხაჭაპური და პურის კერძები", image: null },
  { slug: "cocktail", label: "კოქტეილი", keywords: ["კოქტ", "cocktail"], description: "კოქტეილი და ბარი", image: null },
  { slug: "pasta", label: "პასტა", keywords: ["პასტ", "pasta"], description: "პასტა", image: null },
];

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
