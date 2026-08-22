import { z } from 'zod';

export const favoriteFoodWriteSchema = z.object({
  productId: z
    .string({ error: 'აირჩიე საჭმელი' })
    .trim()
    .min(1, 'აირჩიე საჭმელი'),
  isActive: z.boolean().optional(),
});

export const favoriteFoodPatchSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const favoriteFoodReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type FavoriteFoodWriteInput = z.infer<typeof favoriteFoodWriteSchema>;
export type FavoriteFoodPatchInput = z.infer<typeof favoriteFoodPatchSchema>;
export type FavoriteFoodReorderInput = z.infer<
  typeof favoriteFoodReorderSchema
>;
