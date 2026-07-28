import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'ელფოსტა სავალდებულოა')
    .email('შეიყვანე სწორი ელფოსტა'),
  password: z.string().min(1, 'პაროლი სავალდებულოა'),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'სახელი სავალდებულოა'),
  lastName: z.string().trim().min(1, 'გვარი სავალდებულოა'),
  phone: z
    .string()
    .trim()
    .min(1, 'ტელეფონი სავალდებულოა')
    .regex(/^[\d+\s()-]{9,}$/, 'შეიყვანე სწორი ტელეფონის ნომერი'),
  address: z.string().trim().min(1, 'მისამართი სავალდებულოა'),
  birthDate: z.string().min(1, 'დაბადების თარიღი სავალდებულოა'),
  email: z
    .string()
    .trim()
    .min(1, 'ელფოსტა სავალდებულოა')
    .email('შეიყვანე სწორი ელფოსტა'),
  password: z.string().min(6, 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
