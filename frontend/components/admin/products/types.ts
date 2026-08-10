/** Prisma-ready product types for admin products management */

export type ProductAvailability =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "HIDDEN"
  | "OUT_OF_STOCK";

export type ProductSortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name";

export type ProductAllergens = {
  gluten: boolean;
  milk: boolean;
  eggs: boolean;
  fish: boolean;
  nuts: boolean;
  soy: boolean;
  vegan: boolean;
  vegetarian: boolean;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
};

export type ProductAddOn = {
  id: string;
  name: string;
  price: number;
};

export type ProductCustomizationOption = {
  id?: string;
  name: string;
  price: number;
  sortOrder?: number;
  isAvailable?: boolean;
};

export type ProductCustomizationGroup = {
  id?: string;
  name: string;
  description?: string | null;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  options: ProductCustomizationOption[];
};

export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  isApproved?: boolean;
};

export type AdminCategory = {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
};

/** Full admin product — extends Prisma Product with forward-compatible fields */
export type AdminProduct = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  image: string | null;
  gallery: string[];
  price: number;
  discountPrice: number | null;
  calories: number | null;
  preparationTime: number | null;
  weight: number | null;
  /** Visual food type from quick-select grid */
  foodType?: string | null;
  spicinessLevel?: string | null;
  availability: ProductAvailability;
  /** Maps to Prisma isAvailable for AVAILABLE/UNAVAILABLE */
  isAvailable: boolean;
  allergens: ProductAllergens;
  variants: ProductVariant[];
  addOns: ProductAddOn[];
  customizationGroups: ProductCustomizationGroup[];
  createdAt: string;
  updatedAt: string;
};

export type ProductFormData = Omit<
  AdminProduct,
  "id" | "createdAt" | "updatedAt" | "isAvailable"
>;

export type ProductFilters = {
  search: string;
  restaurantId: string;
  categoryId: string;
  availability: string;
  sort: ProductSortOption;
  page: number;
  pageSize: number;
};

export const DEFAULT_ALLERGENS: ProductAllergens = {
  gluten: false,
  milk: false,
  eggs: false,
  fish: false,
  nuts: false,
  soy: false,
  vegan: false,
  vegetarian: false,
};

export const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
  AVAILABLE: "ხელმისაწვდომი",
  UNAVAILABLE: "მიუწვდომელი",
  HIDDEN: "დამალული",
  OUT_OF_STOCK: "ამოწურული",
};

export const AVAILABILITY_BADGE: Record<
  ProductAvailability,
  "success" | "destructive" | "muted" | "warning"
> = {
  AVAILABLE: "success",
  UNAVAILABLE: "destructive",
  HIDDEN: "muted",
  OUT_OF_STOCK: "warning",
};

export const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "newest", label: "ახალი ჯერ" },
  { value: "oldest", label: "ძველი ჯერ" },
  { value: "price_asc", label: "ფასი ↑" },
  { value: "price_desc", label: "ფასი ↓" },
  { value: "name", label: "სახელი" },
];

/** Map availability to Prisma isAvailable when wiring API */
export function availabilityToIsAvailable(
  availability: ProductAvailability,
): boolean {
  return availability === "AVAILABLE";
}

export function isAvailableToAvailability(
  isAvailable: boolean,
  hidden?: boolean,
  outOfStock?: boolean,
): ProductAvailability {
  if (hidden) return "HIDDEN";
  if (outOfStock) return "OUT_OF_STOCK";
  return isAvailable ? "AVAILABLE" : "UNAVAILABLE";
}

export function createEmptyProductForm(
  restaurantId = "",
  categoryId = "",
): ProductFormData {
  return {
    restaurantId,
    categoryId,
    name: "",
    description: "",
    image: null,
    gallery: [],
    price: 0,
    discountPrice: null,
    calories: null,
    preparationTime: null,
    weight: null,
    foodType: null,
    spicinessLevel: null,
    availability: "AVAILABLE",
    allergens: { ...DEFAULT_ALLERGENS },
    variants: [],
    addOns: [],
    customizationGroups: [],
  };
}

export function productToFormData(product: AdminProduct): ProductFormData {
  const { id: _id, createdAt: _c, updatedAt: _u, isAvailable: _a, ...rest } =
    product;
  return {
    ...rest,
    foodType: rest.foodType ?? null,
    spicinessLevel: rest.spicinessLevel ?? null,
    customizationGroups: rest.customizationGroups ?? [],
  };
}

export function formDataToProduct(
  data: ProductFormData,
  id?: string,
  timestamps?: { createdAt: string; updatedAt: string },
): AdminProduct {
  const now = new Date().toISOString();
  return {
    ...data,
    id: id ?? `prod_${Date.now()}`,
    isAvailable: availabilityToIsAvailable(data.availability),
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? now,
  };
}
