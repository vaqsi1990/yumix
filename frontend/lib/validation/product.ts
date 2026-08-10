import { z } from "zod";
import { PRODUCT_SIZES, normalizeProductVariants } from "@/lib/product-sizes";

export const PRODUCT_VALIDATION_MESSAGES = {
  name: "სახელი სავალდებულოა",
  price: "ფასი უნდა იყოს 0-ზე მეტი",
  image: "სურათი სავალდებულოა",
  category: "აირჩიე კატეგორია",
  restaurant: "აირჩიე რესტორანი",
} as const;

export const productAvailabilitySchema = z.enum([
  "AVAILABLE",
  "UNAVAILABLE",
  "HIDDEN",
  "OUT_OF_STOCK",
]);

export const productSizeSchema = z.enum(PRODUCT_SIZES);

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: productSizeSchema,
  price: z.number().gt(0),
});

export const priceInputSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return value;
      return Number(trimmed.replace(",", "."));
    }
    return value;
  },
  z.number({ error: PRODUCT_VALIDATION_MESSAGES.price }).gt(
    0,
    PRODUCT_VALIDATION_MESSAGES.price,
  ),
);

export const productCoreSchema = z.object({
  name: z.string().trim().min(1, PRODUCT_VALIDATION_MESSAGES.name),
  image: z.string().trim().min(1, PRODUCT_VALIDATION_MESSAGES.image),
  price: priceInputSchema,
});

const discountPriceRefine = {
  check: (data: { price: number; discountPrice?: number | null }) =>
    data.discountPrice == null ||
    data.discountPrice <= 0 ||
    data.discountPrice < data.price,
  message: "ფასდაკლება უნდა იყოს ძირითად ფასზე ნაკლები",
  path: ["discountPrice"] as const,
};

export const productFormSchema = productCoreSchema
  .extend({
    restaurantId: z.string().min(1, PRODUCT_VALIDATION_MESSAGES.restaurant),
    categoryId: z.string().min(1, PRODUCT_VALIDATION_MESSAGES.category),
    discountPrice: z.number().nullable().optional(),
  })
  .refine(discountPriceRefine.check, {
    message: discountPriceRefine.message,
    path: [...discountPriceRefine.path],
  });

export const productDialogSchema = productCoreSchema
  .extend({
    categoryId: z.string().min(1, PRODUCT_VALIDATION_MESSAGES.category),
    description: z.string().nullable().optional(),
    discountPrice: z.number().nullable().optional(),
    preparationTime: z.number().nullable().optional(),
    availability: productAvailabilitySchema,
  })
  .refine(discountPriceRefine.check, {
    message: discountPriceRefine.message,
    path: [...discountPriceRefine.path],
  });

const productWriteBaseSchema = z.object({
  restaurantId: z.string().min(1, PRODUCT_VALIDATION_MESSAGES.restaurant),
  categoryId: z.string().min(1, PRODUCT_VALIDATION_MESSAGES.category),
  name: z.string().trim().min(1, PRODUCT_VALIDATION_MESSAGES.name),
  image: z.string().trim().min(1, PRODUCT_VALIDATION_MESSAGES.image),
  price: z.number().gt(0, PRODUCT_VALIDATION_MESSAGES.price),
  description: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  discountPrice: z.number().nullable().optional(),
  calories: z.number().nullable().optional(),
  preparationTime: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  foodType: z.string().nullable().optional(),
  spicinessLevel: z.string().nullable().optional(),
  availability: productAvailabilitySchema,
  allergens: z
    .object({
      gluten: z.boolean(),
      milk: z.boolean(),
      eggs: z.boolean(),
      fish: z.boolean(),
      nuts: z.boolean(),
      soy: z.boolean(),
      vegan: z.boolean(),
      vegetarian: z.boolean(),
    })
    .optional(),
  variants: z.preprocess(
    (value) =>
      normalizeProductVariants(Array.isArray(value) ? value : []),
    z.array(productVariantSchema).default([]),
  ),
  customizationGroups: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1),
        description: z.string().nullable().optional(),
        required: z.boolean().optional(),
        minSelections: z.number().int().min(0).max(20).optional(),
        maxSelections: z.number().int().min(1).max(20).optional(),
        sortOrder: z.number().int().optional(),
        options: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().trim().min(1),
              price: z.number().min(0),
              sortOrder: z.number().int().optional(),
              isAvailable: z.boolean().optional(),
            }),
          )
          .min(1),
      }),
    )
    .optional()
    .default([]),
});

export const productWriteSchema = productWriteBaseSchema.refine(
  discountPriceRefine.check,
  {
    message: discountPriceRefine.message,
    path: [...discountPriceRefine.path],
  },
);

export const restaurantProductWriteSchema = productWriteBaseSchema
  .omit({ restaurantId: true })
  .refine(discountPriceRefine.check, {
    message: discountPriceRefine.message,
    path: [...discountPriceRefine.path],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductDialogValues = z.infer<typeof productDialogSchema>;
export type ProductWriteValues = z.infer<typeof productWriteSchema>;
export type RestaurantProductWriteValues = z.infer<
  typeof restaurantProductWriteSchema
>;

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "root";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function parseWithSchema<T extends z.ZodType>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string>; message: string } {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  return {
    success: false,
    errors: zodFieldErrors(parsed.error),
    message: parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა",
  };
}

export function isSchemaValid<T extends z.ZodType>(
  schema: T,
  data: unknown,
): data is z.infer<T> {
  return schema.safeParse(data).success;
}
