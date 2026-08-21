import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
  addOns: z
    .array(
      z.object({
        addonId: z.string().min(1),
        quantity: z.number().int().min(1).max(20).default(1),
      }),
    )
    .optional()
    .default([]),
  customizations: z
    .array(
      z.object({
        optionId: z.string().min(1),
        quantity: z.number().int().min(1).max(20).default(1),
      }),
    )
    .optional()
    .default([]),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(99).optional(),
    variantId: z.string().min(1).optional(),
  })
  .refine((data) => data.quantity != null || data.variantId != null, {
    message: 'რაოდენობა ან ზომა სავალდებულოა',
  });

export const addCartExtraSchema = z.object({
  addonId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

export type AddCartExtraDto = z.infer<typeof addCartExtraSchema>;
export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
