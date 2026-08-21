import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "ელფოსტა სავალდებულოა")
    .email("შეიყვანე სწორი ელფოსტა"),
  password: z.string().min(1, "პაროლი სავალდებულოა"),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "სახელი სავალდებულოა"),
    lastName: z.string().trim().min(1, "გვარი სავალდებულოა"),
    phone: z
      .string()
      .trim()
      .min(1, "ტელეფონი სავალდებულოა")
      .regex(/^[\d+\s()-]{9,}$/, "შეიყვანე სწორი ტელეფონის ნომერი"),
    city: z.string().trim().min(1, "ქალაქი სავალდებულოა"),
    street: z.string().trim().min(1, "აირჩიე მისამართი რუკაზე"),
    latitude: z.number("აირჩიე მისამართი რუკაზე"),
    longitude: z.number("აირჩიე მისამართი რუკაზე"),
    birthDate: z.string().min(1, "დაბადების თარიღი სავალდებულოა"),
    email: z
      .string()
      .trim()
      .min(1, "ელფოსტა სავალდებულოა")
      .email("შეიყვანე სწორი ელფოსტა"),
    password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
    confirmPassword: z.string().min(1, "დაადასტურე პაროლი"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები არ ემთხვევა",
    path: ["confirmPassword"],
  });

export const verifyRegisterSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "კოდი უნდა იყოს 6 ციფრი"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "ელფოსტა სავალდებულოა")
    .email("შეიყვანე სწორი ელფოსტა"),
});

export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "კოდი უნდა იყოს 6 ციფრი"),
    password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
    confirmPassword: z.string().min(1, "დაადასტურე პაროლი"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები არ ემთხვევა",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyRegisterFormValues = z.infer<typeof verifyRegisterSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
