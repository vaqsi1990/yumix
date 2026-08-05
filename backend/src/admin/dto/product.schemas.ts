import { z } from "zod";

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

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
});

const discountPriceRefine = {
  check: (data: { price: number; discountPrice?: number | null }) =>
    data.discountPrice == null ||
    data.discountPrice <= 0 ||
    data.discountPrice < data.price,
  message: "ფასდაკლება უნდა იყოს ძირითად ფასზე ნაკლები",
  path: ["discountPrice"] as const,
};

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
  variants: z.array(productVariantSchema).default([]),
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

export const productAvailabilityPatchSchema = z.object({
  availability: productAvailabilitySchema,
});

export type ProductWriteDto = z.infer<typeof productWriteSchema>;
export type RestaurantProductWriteDto = z.infer<
  typeof restaurantProductWriteSchema
>;
