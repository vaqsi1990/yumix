import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  birthDate: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const updatePreferencesSchema = z.object({
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  newRestaurants: z.boolean().optional(),
  discounts: z.boolean().optional(),
  language: z.enum(['ka', 'en', 'ru']).optional(),
  currency: z.enum(['GEL']).optional(),
});

export const updateAddressSchema = z.object({
  title: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  street: z.string().trim().min(1).optional(),
  building: z.string().nullable().optional(),
  entrance: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  deliveryNote: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;

export const DEFAULT_USER_PREFERENCES = {
  orderUpdates: true,
  promotions: true,
  newRestaurants: true,
  discounts: true,
  language: 'ka' as const,
  currency: 'GEL' as const,
};
