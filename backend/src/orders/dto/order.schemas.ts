import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'CARD',
  'CASH',
  'APPLE_PAY',
  'GOOGLE_PAY',
]);

export const createAddressSchema = z.object({
  title: z.string().trim().min(1, 'სათაური სავალდებულოა'),
  city: z.string().trim().min(1, 'ქალაქი სავალდებულოა'),
  street: z.string().trim().min(1, 'ქუჩა სავალდებულოა'),
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

export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'აირჩიე მისამართი'),
  paymentMethod: paymentMethodSchema,
  customerNote: z.string().trim().max(500).nullable().optional(),
});

export const adminAssignCourierSchema = z.object({
  courierId: z.string().min(1),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'PICKED_UP',
    'ON_THE_WAY',
    'DELIVERED',
    'CANCELLED',
  ]),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
