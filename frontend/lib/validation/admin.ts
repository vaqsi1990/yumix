import { z } from "zod";

export {
  productFormSchema,
  productCoreSchema,
  productDialogSchema,
  productWriteSchema,
  restaurantProductWriteSchema,
  productAvailabilitySchema,
  type ProductFormValues,
  type ProductDialogValues,
  type ProductWriteValues,
  type RestaurantProductWriteValues,
} from "./product";

export const adminSettingsSchema = z
  .object({
    firstName: z.string().trim().min(1, "სახელი სავალდებულოა"),
    lastName: z.string().trim().min(1, "გვარი სავალდებულოა"),
    email: z.string().trim().email("შეიყვანე სწორი ელფოსტა"),
    phone: z.string().trim().min(1, "ტელეფონი სავალდებულოა"),
    birthDate: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.newPassword || data.newPassword === data.confirmPassword,
    {
      message: "ახალი პაროლები არ ემთხვევა",
      path: ["confirmPassword"],
    },
  )
  .refine(
    (data) => !data.newPassword || (data.newPassword?.length ?? 0) >= 6,
    {
      message: "ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო",
      path: ["newPassword"],
    },
  );

export const adminUserCreateSchema = z.object({
  firstName: z.string().trim().min(1, "სახელი სავალდებულოა"),
  lastName: z.string().trim().min(1, "გვარი სავალდებულოა"),
  email: z.string().trim().email("შეიყვანე სწორი ელფოსტა"),
  phone: z.string().trim().min(1, "ტელეფონი სავალდებულოა"),
  password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
  role: z.enum(["USER", "COURIER", "RESTAURANT_OWNER", "ADMIN"]),
  isActive: z.boolean(),
});

export const adminUserUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "სახელი სავალდებულოა"),
  lastName: z.string().trim().min(1, "გვარი სავალდებულოა"),
  email: z.string().trim().email("შეიყვანე სწორი ელფოსტა"),
  phone: z.string().trim().min(1, "ტელეფონი სავალდებულოა"),
  password: z
    .string()
    .min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო")
    .optional()
    .or(z.literal("")),
  role: z.enum(["USER", "COURIER", "RESTAURANT_OWNER", "ADMIN"]),
  isActive: z.boolean(),
});

export const adminUserSchema = adminUserCreateSchema;

export const adminCouponSchema = z.object({
  code: z.string().optional(),
  value: z.number().gt(0, "თანხა უნდა იყოს 0-ზე მეტი"),
  assignedToId: z.string().min(1, "აირჩიე თანამშრომელი"),
  expiresAt: z.string().nullable().optional(),
  minimumOrder: z.number().nullable().optional(),
  note: z.string().optional(),
});
