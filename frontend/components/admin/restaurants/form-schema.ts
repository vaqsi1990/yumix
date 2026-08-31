import { z } from "zod";
import type { DayOfWeek } from "./types";

const dayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const workingHourSchema = z.object({
  day: dayEnum,
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean(),
});

export const deliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "ზონის სახელი სავალდებულოა"),
  deliveryFee: z.number().min(0),
  minimumOrder: z.number().min(0),
  estimatedMinutes: z.number().min(1),
});

export const restaurantFormSchema = z.object({
  logo: z.string().nullable(),
  coverImage: z.string().nullable(),
  name: z.string().min(1, "რესტორნის სახელი სავალდებულოა"),
  slug: z.string().optional(),
  description: z.string(),
  categories: z.array(z.string()).min(1, "აირჩიეთ მინიმუმ ერთი კატეგორია"),
  ownerId: z.string().min(1, "აირჩიეთ მფლობელი"),
  ownerPersonalId: z
    .string()
    .trim()
    .min(1, "პირადობის ნომერი სავალდებულოა")
    .regex(/^\d{11}$/, "პირადობის ნომერი უნდა იყოს 11 ციფრი"),
  country: z.string(),
  city: z.string().min(1, "ქალაქი სავალდებულოა"),
  street: z.string().min(1, "ქუჩა სავალდებულოა"),
  building: z.string(),
  floor: z.string(),
  apartment: z.string(),
  postalCode: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  deliveryFee: z.number().min(0),
  deliveryFeePerKm: z.number().min(0),
  minimumOrder: z.number().min(0),
  deliveryRadius: z.number().min(0),
  estimatedDeliveryMinutes: z.number().min(1),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  facebook: z.string(),
  instagram: z.string(),
  workingHours: z.array(workingHourSchema),
  acceptingOrders: z.boolean(),
  approved: z.boolean(),
  featured: z.boolean(),
  visible: z.boolean(),
  supportsPickup: z.boolean(),
  supportsDelivery: z.boolean(),
  paymentCash: z.boolean(),
  paymentCard: z.boolean(),
  paymentApplePay: z.boolean(),
  paymentGooglePay: z.boolean(),
  deliveryZones: z.array(deliveryZoneSchema),
});

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;
export type DeliveryZoneFormValues = z.infer<typeof deliveryZoneSchema>;

export const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug) return slug;
  return `restaurant-${Date.now().toString(36).slice(-6)}`;
}

export function createDefaultWorkingHours(): RestaurantFormValues["workingHours"] {
  return DAYS.map((day) => ({
    day,
    openTime: "10:00",
    closeTime: "22:00",
    isClosed: false,
  }));
}

export function createEmptyDeliveryZone(): DeliveryZoneFormValues {
  return {
    id: `zone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    deliveryFee: 3,
    minimumOrder: 15,
    estimatedMinutes: 30,
  };
}

export function createDefaultRestaurantForm(): RestaurantFormValues {
  return {
    logo: null,
    coverImage: null,
    name: "",
    slug: "",
    description: "",
    categories: [],
    ownerId: "",
    ownerPersonalId: "",
    country: "საქართველო",
    city: "",
    street: "",
    building: "",
    floor: "",
    apartment: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    deliveryFee: 3,
    deliveryFeePerKm: 0,
    minimumOrder: 15,
    deliveryRadius: 5,
    estimatedDeliveryMinutes: 35,
    phone: "",
    email: "",
    website: "",
    facebook: "",
    instagram: "",
    workingHours: createDefaultWorkingHours(),
    acceptingOrders: true,
    approved: false,
    featured: false,
    visible: true,
    supportsPickup: true,
    supportsDelivery: true,
    paymentCash: true,
    paymentCard: true,
    paymentApplePay: false,
    paymentGooglePay: false,
    deliveryZones: [],
  };
}
