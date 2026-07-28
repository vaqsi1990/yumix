"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth-context";
import type { ApiUser } from "@/lib/api";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validation/auth";

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20";

const labelClassName =
  "mb-1.5 block font-[family-name:var(--font-inter)] text-[18px] font-medium text-neutral-700 md:text-[20px]";

export default function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: ApiUser };

      if (!res.ok || !data.user) {
        setFormError(data.error || "ელფოსტა ან პაროლი არასწორია");
        return;
      }

      setUser(data.user);
      router.push("/");
      router.refresh();
    } catch {
      setFormError("შესვლა ვერ მოხერხდა. სცადე თავიდან.");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_0_4px_0_rgba(0,0,0,0.12)] sm:p-8">
      <h1 className="mb-6 text-center font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
        შესვლა
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div>
          <label htmlFor="email" className={labelClassName}>
            ელფოსტა
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            პაროლი
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            placeholder="შენი პაროლი"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full cursor-pointer rounded-lg bg-[#FF0050] py-3 font-[family-name:var(--font-inter)] text-[18px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:opacity-60 md:text-[20px]"
        >
          {isSubmitting ? "იტვირთება..." : "შესვლა"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        არ გაქვს ანგარიში?{" "}
        <Link href="/reg" className="font-medium text-[#FF0050] hover:underline">
          რეგისტრაცია
        </Link>
      </p>
    </div>
  );
}
