import { STANDARD_MENU_CATEGORIES } from "./menu-category-order";

export type CategorySubcategoryDef = {
  slug: string;
  label: string;
  keywords: string[];
};

export type RestaurantCategoryDef = {
  slug: string;
  label: string;
  keywords: string[];
  description: string;
  image: string | null;
  subcategories: CategorySubcategoryDef[];
};

const GEORGIAN_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "khinkali", label: "ხინკალი", keywords: ["ხინკ", "khinkali"] },
  { slug: "khachapuri", label: "ხაჭაპური", keywords: ["ხაჭაპ", "khachapuri"] },
  { slug: "mtsvadi", label: "მწვადი", keywords: ["მწვად", "mtsvadi", "shashlik"] },
  { slug: "kababi", label: "ქაბაბი", keywords: ["ქაბაბ", "kababi", "kebab"] },
  { slug: "chakapuli", label: "ჩაქაფული", keywords: ["ჩაქაფ", "chakapuli"] },
  { slug: "chashushuli", label: "ჩაშუშული", keywords: ["ჩაშუშ", "chashushuli"] },
  { slug: "kharcho", label: "ხარჩო", keywords: ["ხარჩ", "kharcho"] },
  { slug: "lobio", label: "ლობიო", keywords: ["ლობიო", "lobio"] },
  { slug: "lobiani", label: "ლობიანი", keywords: ["ლობიან", "lobiani"] },
  { slug: "pkhali", label: "ფხალი", keywords: ["ფხალ", "pkhali"] },
  { slug: "kupati", label: "კუპატი", keywords: ["კუპატ", "kupati"] },
  { slug: "mchadi", label: "მჭადი", keywords: ["მჭად", "mchadi"] },
  {
    slug: "cold-dishes",
    label: "ცივი კერძები",
    keywords: ["ცივი კერძ", "cold dish"],
  },
  {
    slug: "georgian-salads",
    label: "ქართული სალათები",
    keywords: ["ქართულ სალათ", "georgian salad"],
  },
  {
    slug: "georgian-desserts",
    label: "ქართული დესერტები",
    keywords: ["ქართულ დესერტ", "georgian dessert", "ჩურჩხელ", "გოზინაკ"],
  },
  { slug: "elarji", label: "ელარჯი", keywords: ["ელარჯ", "elarji"] },
  { slug: "ghomi", label: "ღომი", keywords: ["ღომ", "ghomi"] },
  { slug: "sacivi", label: "საცივი", keywords: ["საცივ", "sacivi"] },
  { slug: "baje", label: "ბაჟე", keywords: ["ბაჟ", "baje"] },
];

const FOREIGN_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "italian", label: "იტალიური", keywords: ["იტალიურ", "italian", "პასტ"] },
  { slug: "asian", label: "აზიური", keywords: ["აზიურ", "asian"] },
  { slug: "japanese", label: "იაპონური", keywords: ["იაპონ", "japanese", "სუში", "sushi"] },
  { slug: "chinese", label: "ჩინური", keywords: ["ჩინურ", "chinese"] },
  { slug: "american", label: "ამერიკული", keywords: ["ამერიკ", "american"] },
  { slug: "mexican", label: "მექსიკური", keywords: ["მექსიკ", "mexican", "ტაკო", "taco"] },
  { slug: "turkish", label: "თურქული", keywords: ["თურქ", "turkish", "ქებაბ", "kebab"] },
  { slug: "indian", label: "ინდური", keywords: ["ინდურ", "indian", "კარი", "curry"] },
  { slug: "french", label: "ფრანგული", keywords: ["ფრანგ", "french"] },
  { slug: "greek", label: "ბერძნული", keywords: ["ბერძნ", "greek", "გიროს", "gyro"] },
  { slug: "spanish", label: "ესპანური", keywords: ["ესპან", "spanish", "პაელია", "paella"] },
  { slug: "arabic", label: "არაბული", keywords: ["არაბ", "arabic", "შავერმა", "shawarma"] },
];

const FAST_FOOD_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "burger", label: "ბურგერი", keywords: ["ბურგერ", "burger"] },
  { slug: "shawarma", label: "შაურმა", keywords: ["შაურმ", "shawarma"] },
  { slug: "hot-dog", label: "ჰოთ-დოგი", keywords: ["ჰოთ-დოგ", "hot-dog", "hot dog"] },
  { slug: "french-fries", label: "კარტოფილი ფრი", keywords: ["ფრი", "french fries", "კარტოფილ"] },
  { slug: "nuggets", label: "ნაგეთსი", keywords: ["nugget", "ნაგეთ", "nuggets"] },
  { slug: "chicken", label: "ჩიქენი", keywords: ["ჩიქენ", "chicken"] },
  { slug: "sandwich", label: "სენდვიჩი", keywords: ["სენდვიჩ", "sandwich"] },
  { slug: "toast", label: "ტოსტი", keywords: ["ტოსტ", "toast"] },
  { slug: "taco", label: "ტაკო", keywords: ["ტაკო", "taco"] },
  { slug: "wrap", label: "რაპი", keywords: ["რაპ", "wrap"] },
  { slug: "combo-menu", label: "კომბო მენიუ", keywords: ["კომბო", "combo"] },
];

const BAKERY_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "pizza", label: "პიცა", keywords: ["პიც", "pizza"] },
  { slug: "khachapuri", label: "ხაჭაპური", keywords: ["ხაჭაპ", "khachapuri"] },
  { slug: "lobiani", label: "ლობიანი", keywords: ["ლობიან", "lobiani"] },
  { slug: "kubdari", label: "კუბდარი", keywords: ["კუბდარ", "kubdari"] },
  { slug: "khvezeli", label: "ღვეზელი", keywords: ["ღვეზ", "khvezeli"] },
  { slug: "croissant", label: "კრუასანი", keywords: ["კრუას", "croissant"] },
  { slug: "puff-pastry", label: "ფუნთუშა", keywords: ["ფუნთ", "puff pastry"] },
  { slug: "bread", label: "პური", keywords: ["პურ", "bread"] },
  { slug: "donut", label: "დონატი", keywords: ["დონატ", "donut"] },
  { slug: "muffin", label: "მაფინი", keywords: ["მაფინ", "muffin"] },
  { slug: "brownie", label: "ბრაუნი", keywords: ["ბრაუნ", "brownie"] },
  { slug: "baguette", label: "ბაგეტი", keywords: ["ბაგეტ", "baguette"] },
];

const SEAFOOD_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "fish", label: "თევზი", keywords: ["თევზ", "fish"] },
  { slug: "salmon", label: "ორაგული", keywords: ["ორაგულ", "salmon"] },
  { slug: "squid", label: "კალმარი", keywords: ["კალმარ", "squid", "calamari"] },
  { slug: "shrimp", label: "კრევეტი", keywords: ["კრევეტ", "shrimp", "prawn"] },
  { slug: "mussels", label: "მიდია", keywords: ["მიდი", "mussel"] },
  { slug: "octopus", label: "ოქტოპუსი", keywords: ["ოქტოპ", "octopus"] },
  { slug: "crab", label: "კიბორჩხალა", keywords: ["კიბორჩხ", "crab"] },
  {
    slug: "seafood-mix",
    label: "ზღვის პროდუქტების მიქსი",
    keywords: ["ზღვის მიქს", "seafood mix", "ზღვის პროდუქტ"],
  },
  {
    slug: "fish-portion",
    label: "თევზის",
    keywords: ["თევზის", "fish dish"],
  },
  {
    slug: "fish-fillet",
    label: "თევზის ფილე",
    keywords: ["თევზის ფილ", "fish fillet", "fillet"],
  },
];

const SALAD_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "caesar", label: "ცეზარი", keywords: ["ცეზარ", "caesar"] },
  {
    slug: "greek-salad",
    label: "ბერძნული სალათი",
    keywords: ["ბერძნ სალათ", "greek salad"],
  },
  { slug: "olivier", label: "ოლივიე", keywords: ["ოლივიე", "olivier"] },
  {
    slug: "vegetable-salad",
    label: "ბოსტნეულის სალათი",
    keywords: ["ბოსტნეულის სალათ", "vegetable salad"],
  },
  {
    slug: "chicken-salad",
    label: "ქათმის სალათი",
    keywords: ["ქათმის სალათ", "chicken salad"],
  },
  {
    slug: "tuna-salad",
    label: "ტუნას სალათი",
    keywords: ["ტუნას სალათ", "tuna salad"],
  },
  {
    slug: "avocado-salad",
    label: "ავოკადოს სალათი",
    keywords: ["ავოკადოს სალათ", "avocado salad"],
  },
  {
    slug: "fruit-salad",
    label: "ხილის სალათი",
    keywords: ["ხილის სალათ", "fruit salad"],
  },
  {
    slug: "poke-bowl",
    label: "პოკე ბოული",
    keywords: ["პოკე", "poke bowl", "poke"],
  },
];

const SOUP_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "kharcho", label: "ხარჩო", keywords: ["ხარჩ", "kharcho"] },
  { slug: "chikhirtma", label: "ჩიხირთმა", keywords: ["ჩიხირთ", "chikhirtma"] },
  {
    slug: "chicken-soup",
    label: "ქათმის სუპი",
    keywords: ["ქათმის სუპ", "chicken soup"],
  },
  {
    slug: "vegetable-soup",
    label: "ბოსტნეულის სუპი",
    keywords: ["ბოსტნეულის სუპ", "vegetable soup"],
  },
  {
    slug: "mushroom-soup",
    label: "სოკოს სუპი",
    keywords: ["სოკოს სუპ", "mushroom soup"],
  },
  {
    slug: "cream-soup",
    label: "კრემ-სუპი",
    keywords: ["კრემ-სუპ", "cream soup"],
  },
  {
    slug: "tomato-soup",
    label: "ტომატის სუპი",
    keywords: ["ტომატის სუპ", "tomato soup"],
  },
  { slug: "ramen", label: "რამენი", keywords: ["რამენ", "ramen"] },
  { slug: "tom-yum", label: "ტომ იამი", keywords: ["ტომ იამ", "tom yum"] },
  {
    slug: "lentil-soup",
    label: "ოსპის სუპი",
    keywords: ["ოსპის სუპ", "lentil soup", "ოსპ"],
  },
];

const DESSERT_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "cake", label: "ტორტი", keywords: ["ტორტ", "cake"] },
  { slug: "cheesecake", label: "ჩიზქეიქი", keywords: ["ჩიზქეიქ", "cheesecake"] },
  { slug: "pastry", label: "ნამცხვარი", keywords: ["ნამცხვარ", "pastry"] },
  { slug: "ice-cream", label: "ნაყინი", keywords: ["ნაყინ", "ice cream"] },
  { slug: "donut", label: "დონატი", keywords: ["დონატ", "donut"] },
  { slug: "waffle", label: "ვაფლი", keywords: ["ვაფლ", "waffle"] },
  { slug: "pancake", label: "ბლინი", keywords: ["ბლინ", "pancake"] },
  { slug: "tiramisu", label: "ტირამისუ", keywords: ["ტირამ", "tiramisu"] },
  { slug: "eclair", label: "ეკლერი", keywords: ["ეკლერ", "eclair"] },
  { slug: "macaron", label: "მაკარონი", keywords: ["მაკარონ", "macaron"] },
  { slug: "pudding", label: "პუდინგი", keywords: ["პუდინგ", "pudding"] },
  {
    slug: "fruit-dessert",
    label: "ხილის დესერტი",
    keywords: ["ხილის დესერტ", "fruit dessert"],
  },
];

const BREAKFAST_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "eggs", label: "კვერცხი", keywords: ["კვერცხ", "egg", "eggs"] },
  { slug: "omelet", label: "ომლეტი", keywords: ["ომლეტ", "omelet", "omelette"] },
  { slug: "pancake", label: "ბლინი", keywords: ["ბლინ", "pancake"] },
  { slug: "porridge", label: "ფაფა", keywords: ["ფაფ", "porridge"] },
  { slug: "granola", label: "გრანოლა", keywords: ["გრანოლ", "granola"] },
  {
    slug: "avocado-toast",
    label: "ავოკადო ტოსტი",
    keywords: ["ავოკადო ტოსტ", "avocado toast"],
  },
  { slug: "sandwich", label: "სენდვიჩი", keywords: ["სენდვიჩ", "sandwich"] },
  { slug: "croissant", label: "კრუასანი", keywords: ["კრუას", "croissant"] },
  {
    slug: "breakfast-box",
    label: "საუზმის ბოქსი",
    keywords: ["საუზმის ბოქს", "breakfast box"],
  },
  {
    slug: "breakfast-combo",
    label: "საუზმის კომბო",
    keywords: ["საუზმის კომბო", "breakfast combo"],
  },
];

const HEALTHY_SUBCATEGORIES: CategorySubcategoryDef[] = [
  {
    slug: "chicken-fillet",
    label: "ქათმის ფილე",
    keywords: ["ქათმის ფილ", "chicken fillet"],
  },
  { slug: "salmon", label: "ორაგული", keywords: ["ორაგულ", "salmon"] },
  { slug: "tuna", label: "ტუნა", keywords: ["ტუნ", "tuna"] },
  { slug: "avocado", label: "ავოკადო", keywords: ["ავოკად", "avocado"] },
  { slug: "quinoa", label: "ქინოა", keywords: ["ქინო", "quinoa"] },
  { slug: "rice", label: "ბრინჯი", keywords: ["ბრინჯ", "rice"] },
  { slug: "bulgur", label: "ბულგური", keywords: ["ბულგურ", "bulgur"] },
  { slug: "buckwheat", label: "წიწიბურა", keywords: ["წიწიბურ", "buckwheat"] },
  {
    slug: "oatmeal",
    label: "შვრიის ფაფა",
    keywords: ["შვრიის ფაფ", "oatmeal"],
  },
  {
    slug: "vegetable-bowl",
    label: "ბოსტნეულის ბოული",
    keywords: ["ბოსტნეულის ბოულ", "vegetable bowl"],
  },
  { slug: "poke-bowl", label: "პოკე ბოული", keywords: ["პოკე", "poke bowl"] },
  {
    slug: "caesar-salad",
    label: "ცეზარის სალათი",
    keywords: ["ცეზარის სალათ", "caesar salad"],
  },
  {
    slug: "greek-salad",
    label: "ბერძნული სალათი",
    keywords: ["ბერძნ სალათ", "greek salad"],
  },
  {
    slug: "chicken-salad",
    label: "ქათმის სალათი",
    keywords: ["ქათმის სალათ", "chicken salad"],
  },
  {
    slug: "tuna-salad",
    label: "ტუნას სალათი",
    keywords: ["ტუნას სალათ", "tuna salad"],
  },
  {
    slug: "avocado-toast",
    label: "ავოკადოს ტოსტი",
    keywords: ["ავოკადო ტოსტ", "avocado toast"],
  },
  { slug: "hummus", label: "ჰუმუსი", keywords: ["ჰუმუს", "hummus"] },
  { slug: "falafel", label: "ფალაფელი", keywords: ["ფალაფელ", "falafel"] },
  { slug: "smoothie", label: "სმუზი", keywords: ["სმუზ", "smoothie"] },
  {
    slug: "chia-pudding",
    label: "ჩიას პუდინგი",
    keywords: ["ჩიას პუდინგ", "chia pudding"],
  },
  { slug: "granola", label: "გრანოლა", keywords: ["გრანოლ", "granola"] },
  { slug: "nuts", label: "თხილეული", keywords: ["თხილ", "nuts"] },
  { slug: "dried-fruit", label: "ჩირი", keywords: ["ჩირ", "dried fruit"] },
  {
    slug: "protein-dessert",
    label: "პროტეინული დესერტი",
    keywords: ["პროტეინულ დესერტ", "protein dessert", "პროტეინ"],
  },
  {
    slug: "sugar-free-dessert",
    label: "უშაქრო დესერტი",
    keywords: ["უშაქრო დესერტ", "sugar free dessert"],
  },
  {
    slug: "cold-pressed-juice",
    label: "ცივი დაწურული წვენი",
    keywords: ["დაწურულ წვენ", "cold pressed juice"],
  },
];

const VEGETARIAN_SUBCATEGORIES: CategorySubcategoryDef[] = [
  {
    slug: "veggie-burger",
    label: "ვეგეტარიანული ბურგერი",
    keywords: ["ვეგეტარიანულ ბურგერ", "veggie burger", "vegetarian burger"],
  },
  {
    slug: "vegetable-pasta",
    label: "ბოსტნეულის პასტა",
    keywords: ["ბოსტნეულის პასტ", "vegetable pasta", "veggie pasta"],
  },
  {
    slug: "vegetable-pizza",
    label: "ბოსტნეულის პიცა",
    keywords: ["ბოსტნეულის პიც", "vegetable pizza", "veggie pizza"],
  },
  {
    slug: "vegetable-burger",
    label: "ბოსტნეულის ბურგერი",
    keywords: ["ბოსტნეულის ბურგერ", "vegetable burger"],
  },
  { slug: "falafel", label: "ფალაფელი", keywords: ["ფალაფელ", "falafel"] },
  { slug: "hummus", label: "ჰუმუსი", keywords: ["ჰუმუს", "hummus"] },
  {
    slug: "vegetable-wrap",
    label: "ბოსტნეულის რაპი",
    keywords: ["ბოსტნეულის რაპ", "vegetable wrap", "veggie wrap"],
  },
  {
    slug: "vegetarian-sushi",
    label: "ვეგეტარიანული სუში",
    keywords: ["ვეგეტარიანულ სუშ", "vegetarian sushi", "veggie sushi"],
  },
  {
    slug: "vegetable-dishes",
    label: "ბოსტნეულის კერძები",
    keywords: ["ბოსტნეულის კერძ", "vegetable dishes"],
  },
  {
    slug: "cheese-dishes",
    label: "ყველის კერძები",
    keywords: ["ყველის კერძ", "cheese dishes"],
  },
];

const SNACK_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "chips", label: "ჩიფსი", keywords: ["ჩიფს", "chips"] },
  { slug: "popcorn", label: "პოპკორნი", keywords: ["პოპკორნ", "popcorn"] },
  { slug: "nachos", label: "ნაჩოსი", keywords: ["ნაჩოს", "nachos"] },
  { slug: "nuts", label: "თხილეული", keywords: ["თხილ", "nuts"] },
  { slug: "dried-fruit", label: "ჩირი", keywords: ["ჩირ", "dried fruit"] },
  { slug: "skewers", label: "ჩხირები", keywords: ["ჩხირ", "skewers"] },
  { slug: "crackers", label: "კრეკერი", keywords: ["კრეკერ", "cracker"] },
  {
    slug: "chicken-nuggets",
    label: "ქათმის ნაგეთსი",
    keywords: ["ქათმის ნაგეთ", "chicken nuggets"],
  },
  {
    slug: "mozzarella-sticks",
    label: "მოცარელას ჩხირები",
    keywords: ["მოცარელას ჩხირ", "mozzarella sticks"],
  },
  {
    slug: "onion-rings",
    label: "ხახვის რგოლები",
    keywords: ["ხახვის რგოლ", "onion rings"],
  },
  {
    slug: "cheese-balls",
    label: "ყველის ბურთულები",
    keywords: ["ყველის ბურთულ", "cheese balls"],
  },
  {
    slug: "snack-box",
    label: "სნექ-ბოქსი",
    keywords: ["სნექ-ბოქს", "snack box"],
  },
];

const DRINK_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "coffee", label: "ყავა", keywords: ["ყავ", "coffee"] },
  { slug: "tea", label: "ჩაი", keywords: ["ჩაი", "tea"] },
  { slug: "iced-coffee", label: "ცივი ყავა", keywords: ["ცივი ყავ", "iced coffee"] },
  { slug: "lemonade", label: "ლიმონათი", keywords: ["ლიმონათ", "lemonade"] },
  { slug: "juice", label: "წვენი", keywords: ["წვენ", "juice"] },
  { slug: "smoothie", label: "სმუზი", keywords: ["სმუზ", "smoothie"] },
  { slug: "milkshake", label: "მილქშეიქი", keywords: ["მილქშეიქ", "milkshake"] },
  { slug: "cocktail", label: "კოქტეილი", keywords: ["კოქტ", "cocktail"] },
  {
    slug: "soda",
    label: "გაზიანი სასმელი",
    keywords: ["გაზიან", "soda", "cola", "ლიმონათ"],
  },
  {
    slug: "energy-drink",
    label: "ენერგეტიკული სასმელი",
    keywords: ["ენერგეტიკ", "energy drink"],
  },
  {
    slug: "mineral-water",
    label: "მინერალური წყალი",
    keywords: ["მინერალურ წყალ", "mineral water"],
  },
  { slug: "water", label: "წყალი", keywords: ["წყალ", "water"] },
];

const SAUCE_SUBCATEGORIES: CategorySubcategoryDef[] = [
  { slug: "ketchup", label: "კეტჩუპი", keywords: ["კეტჩ", "ketchup"] },
  { slug: "mayonnaise", label: "მაიონეზი", keywords: ["მაიო", "mayonnaise", "mayo"] },
  {
    slug: "garlic-sauce",
    label: "ნივრის სოუსი",
    keywords: ["ნივრის სოუს", "garlic sauce"],
  },
  {
    slug: "cheese-sauce",
    label: "ყველის სოუსი",
    keywords: ["ყველის სოუს", "cheese sauce"],
  },
  {
    slug: "bbq-sauce",
    label: "ბარბექიუს სოუსი",
    keywords: ["ბარბექიუ", "bbq sauce", "barbecue sauce"],
  },
  {
    slug: "mustard-sauce",
    label: "მდოგვის სოუსი",
    keywords: ["მდოგვის სოუს", "mustard sauce", "მდოგვ"],
  },
  {
    slug: "chili-sauce",
    label: "ჩილის სოუსი",
    keywords: ["ჩილის სოუს", "chili sauce"],
  },
  {
    slug: "sweet-sour-sauce",
    label: "ტკბილი-ცხარე სოუსი",
    keywords: ["ტკბილი-ცხარე", "sweet and sour sauce"],
  },
  {
    slug: "tartar-sauce",
    label: "ტარტარის სოუსი",
    keywords: ["ტარტარ", "tartar sauce"],
  },
  {
    slug: "caesar-sauce",
    label: "ცეზარის სოუსი",
    keywords: ["ცეზარის სოუს", "caesar sauce"],
  },
  { slug: "adjika", label: "აჯიკა", keywords: ["აჯიკ", "adjika"] },
  { slug: "tkemali", label: "ტყემალი", keywords: ["ტყემალ", "tkemali"] },
  { slug: "satsebeli", label: "საწებელი", keywords: ["საწებელ", "satsebeli"] },
  { slug: "pesto", label: "პესტო", keywords: ["პესტ", "pesto"] },
  {
    slug: "soy-sauce",
    label: "სოიოს სოუსი",
    keywords: ["სოიოს", "soy sauce"],
  },
];

type CategoryMeta = {
  slug: string;
  description: string;
  image: string | null;
  subcategories?: CategorySubcategoryDef[];
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  ქართული: {
    slug: "georgian",
    description: "ტრადიციული ქართული კერძები",
    image: "/cat/4.png",
    subcategories: GEORGIAN_SUBCATEGORIES,
  },
  უცხოური: {
    slug: "foreign",
    description: "უცხოური და ანტონომიური კერძები",
    image: "/cat/3.png",
    subcategories: FOREIGN_SUBCATEGORIES,
  },
  "სწრაფი კვება": {
    slug: "fast-food",
    description: "ბურგერები, შაურმა და ფასთფუდი",
    image: "/cat/2.png",
    subcategories: FAST_FOOD_SUBCATEGORIES,
  },
  გამომცხვრები: {
    slug: "bakery",
    description: "პიცა, ცომეული და გამომცხვრები",
    image: "/cat/1.png",
    subcategories: BAKERY_SUBCATEGORIES,
  },
  "ზღვის პროდუქტები": {
    slug: "seafood",
    description: "თევზი და ზღვის პროდუქტები",
    image: null,
    subcategories: SEAFOOD_SUBCATEGORIES,
  },
  სალათები: {
    slug: "salads",
    description: "ახალი და ჯანსაღი სალათები",
    image: "/cat/5.png",
    subcategories: SALAD_SUBCATEGORIES,
  },
  სუპები: {
    slug: "soups",
    description: "ცხელი სუპები და ბულიონები",
    image: "/cat/6.png",
    subcategories: SOUP_SUBCATEGORIES,
  },
  დესერტები: {
    slug: "desserts",
    description: "ტკბილეული და დესერტები",
    image: "/cat/7.png",
    subcategories: DESSERT_SUBCATEGORIES,
  },
  საუზმე: {
    slug: "breakfast",
    description: "საუზმის კერძები",
    image: null,
    subcategories: BREAKFAST_SUBCATEGORIES,
  },
  "ჯანსაღი კვება": {
    slug: "healthy",
    description: "ჯანსაღი და ბალანსირებული კერძები",
    image: null,
    subcategories: HEALTHY_SUBCATEGORIES,
  },
  ვეგეტარიანული: {
    slug: "vegetarian",
    description: "ვეგეტარიანული და ვეგანური მენიუ",
    image: null,
    subcategories: VEGETARIAN_SUBCATEGORIES,
  },
  სნექები: {
    slug: "snacks",
    description: "სნექები და აპეტაიზერები",
    image: null,
    subcategories: SNACK_SUBCATEGORIES,
  },
  სასმელები: {
    slug: "drinks",
    description: "ცივი და ცხელი სასმელები",
    image: "/cat/8.png",
    subcategories: DRINK_SUBCATEGORIES,
  },
  სოუსები: {
    slug: "sauces",
    description: "სოუსები და დამატებები",
    image: null,
    subcategories: SAUCE_SUBCATEGORIES,
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
      subcategories: meta.subcategories ?? [],
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
  return [...sub.keywords, sub.label];
}
