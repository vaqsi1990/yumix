"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth";

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20";

const labelClassName =
  "mb-1.5 block font-[family-name:var(--font-inter)] text-[18px] font-medium text-neutral-700 md:text-[20px]";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetting },
    setValue: setResetValue,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  async function sendResetCode(email: string) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = (await res.json()) as { error?: string; email?: string };

    if (!res.ok) {
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "კოდის გაგზავნა ვერ მოხერხდა",
      );
    }

    return data.email ?? email.trim().toLowerCase();
  }

  async function onEmailSubmit(values: ForgotPasswordFormValues) {
    setFormError("");
    try {
      const email = await sendResetCode(values.email);
      setPendingEmail(email);
      setStep("reset");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ქსელის შეცდომა. სცადე თავიდან.",
      );
    }
  }

  async function onResetSubmit(values: ResetPasswordFormValues) {
    setFormError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: values.code.trim(),
          password: values.password,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFormError(
          typeof data.error === "string"
            ? data.error
            : "პაროლის აღდგენა ვერ მოხერხდა",
        );
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setFormError("ქსელის შეცდომა. სცადე თავიდან.");
    }
  }

  async function onResend() {
    if (!pendingEmail || resending) return;
    setFormError("");
    setResending(true);
    try {
      await sendResetCode(pendingEmail);
      setResetValue("code", "");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "კოდის ხელახლა გაგზავნა ვერ მოხერხდა",
      );
    } finally {
      setResending(false);
    }
  }

  if (step === "reset") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_0_4px_0_rgba(0,0,0,0.12)] sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
            ახალი პაროლი
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            6-ციფრიანი კოდი გამოგიგზავნეთ{" "}
            <span className="font-medium text-neutral-800">{pendingEmail}</span>
          </p>
        </div>

        <form
          onSubmit={handleResetSubmit(onResetSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="code" className={labelClassName}>
              აღდგენის კოდი
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`${inputClassName} tracking-[0.35em] text-center text-lg font-semibold`}
              placeholder="000000"
              {...registerReset("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                },
              })}
            />
            {resetErrors.code && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.code.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={labelClassName}>
              ახალი პაროლი
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              placeholder="მინიმუმ 6 სიმბოლო"
              {...registerReset("password")}
            />
            {resetErrors.password && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClassName}>
              პაროლის დადასტურება
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              placeholder="გაიმეორე პაროლი"
              {...registerReset("confirmPassword")}
            />
            {resetErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.confirmPassword.message}
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
            disabled={isResetting}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#FF0050] py-3 font-[family-name:var(--font-inter)] text-[18px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:opacity-60 md:text-[20px]"
          >
            {isResetting ? "ინახება..." : "პაროლის შეცვლა"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-neutral-500">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="font-medium text-[#FF0050] hover:underline disabled:opacity-60"
          >
            {resending ? "იგზავნება..." : "კოდის ხელახლა გაგზავნა"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setFormError("");
            }}
            className="hover:underline"
          >
            უკან დაბრუნება
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_0_4px_0_rgba(0,0,0,0.12)] sm:p-8">
      <h1 className="mb-2 text-center font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
        პაროლის აღდგენა
      </h1>
      <p className="mb-6 text-center text-sm text-neutral-500">
        შეიყვანე ელფოსტა და გამოგიგზავნით აღდგენის კოდს
      </p>

      <form
        onSubmit={handleSubmit(onEmailSubmit)}
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
          {isSubmitting ? "იგზავნება..." : "კოდის გაგზავნა"}
        </button>
      </form>

      <p className="mt-6 text-center text-base text-neutral-500">
        გახსოვს პაროლი?{" "}
        <Link href="/login" className="font-medium text-[#FF0050] hover:underline">
          შესვლა
        </Link>
      </p>
    </div>
  );
}
