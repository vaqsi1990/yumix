import { z } from 'zod';

const optionalDate = z.union([z.string().min(1), z.null()]).optional();

export const restaurantCouponCreateSchema = z.object({
  code: z.string().trim().min(1, 'კოდი სავალდებულოა').max(32),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive('ფასდაკლების ღირებულება უნდა იყოს 0-ზე მეტი'),
  minimumOrder: z.number().min(0).nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  startsAt: optionalDate,
  expiresAt: optionalDate,
  isActive: z.boolean().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const restaurantCouponUpdateSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minimumOrder: z.number().min(0).nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  startsAt: optionalDate,
  expiresAt: optionalDate,
  isActive: z.boolean().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const restaurantCouponStatusSchema = z.object({
  isActive: z.boolean(),
});

export type RestaurantCouponCreateInput = z.infer<
  typeof restaurantCouponCreateSchema
>;
export type RestaurantCouponUpdateInput = z.infer<
  typeof restaurantCouponUpdateSchema
>;
