"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth-context";
import type { ApiUser } from "@/lib/api";
import {
  registerSchema,
  verifyRegisterSchema,
  type RegisterFormValues,
  type VerifyRegisterFormValues,
} from "@/lib/validation/auth";

const inputClassName =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20";

const labelClassName =
  "mb-1.5 block font-[family-name:var(--font-inter)] text-[18px] font-medium text-neutral-700 md:text-[20px]";

export default function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPayload, setPendingPayload] = useState<Omit<
    RegisterFormValues,
    "confirmPassword"
  > | null>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      birthDate: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerCode,
    handleSubmit: handleVerifySubmit,
    formState: { errors: verifyErrors, isSubmitting: isVerifying },
    setValue: setCodeValue,
  } = useForm<VerifyRegisterFormValues>({
    resolver: zodResolver(verifyRegisterSchema),
    defaultValues: { code: "" },
  });

  async function sendCode(
    values: Omit<RegisterFormValues, "confirmPassword">,
  ) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        birthDate: values.birthDate,
        email: values.email.trim(),
        password: values.password,
      }),
    });

    const data = (await res.json()) as { error?: string; email?: string };

    if (!res.ok) {
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "რეგისტრაცია ვერ მოხერხდა",
      );
    }

    return data.email ?? values.email.trim().toLowerCase();
  }

  async function onSubmit(values: RegisterFormValues) {
    setFormError("");
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        address: values.address,
        birthDate: values.birthDate,
        email: values.email,
        password: values.password,
      };
      const email = await sendCode(payload);
      setPendingPayload(payload);
      setPendingEmail(email);
      setStep("verify");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "ქსელის შეცდომა. სცადე თავიდან.",
      );
    }
  }

  async function onVerify(values: VerifyRegisterFormValues) {
    setFormError("");
    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: values.code.trim(),
        }),
      });

      const data = (await res.json()) as { error?: string; user?: ApiUser };

      if (!res.ok) {
        setFormError(
          typeof data.error === "string"
            ? data.error
            : "ვერიფიკაცია ვერ მოხერხდა",
        );
        return;
      }

      if (data.user) setUser(data.user);
      setSubmittedName(data.user?.firstName ?? pendingPayload?.firstName ?? "");
      setStep("done");
      router.push("/");
      router.refresh();
    } catch {
      setFormError("ქსელის შეცდომა. სცადე თავიდან.");
    }
  }

  async function onResend() {
    if (!pendingPayload || resending) return;
    setFormError("");
    setResending(true);
    try {
      const email = await sendCode(pendingPayload);
      setPendingEmail(email);
      setCodeValue("code", "");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "კოდის ხელახლა გაგზავნა ვერ მოხერხდა",
      );
    } finally {
      setResending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[0_0_4px_0_rgba(0,0,0,0.12)] sm:p-10">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#FF0050]/10 text-2xl text-[#FF0050]">
          ✓
        </div>
        <h2 className="font-[family-name:var(--font-inter)] text-xl font-semibold text-neutral-900">
          რეგისტრაცია წარმატებით გაიარე
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          გამარჯობა, {submittedName}! შენ უკვე შესული ხარ.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-6 py-2.5 font-[family-name:var(--font-inter)] text-[18px] font-medium text-white transition hover:bg-[#e60048] md:text-[20px]"
        >
          მთავარზე გადასვლა
        </Link>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_0_4px_0_rgba(0,0,0,0.12)] sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
            ელფოსტის ვერიფიკაცია
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            6-ციფრიანი კოდი გამოგიგზავნეთ{" "}
            <span className="font-medium text-neutral-800">{pendingEmail}</span>
          </p>
        </div>

        <form
          onSubmit={handleVerifySubmit(onVerify)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="code" className={labelClassName}>
              ვერიფიკაციის კოდი
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`${inputClassName} tracking-[0.35em] text-center text-lg font-semibold`}
              placeholder="000000"
              {...registerCode("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                },
              })}
            />
            {verifyErrors.code && (
              <p className="mt-1 text-xs text-red-500">
                {verifyErrors.code.message}
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
            disabled={isVerifying}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#FF0050] py-3 font-[family-name:var(--font-inter)] text-[18px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:opacity-60 md:text-[20px]"
          >
            {isVerifying ? "მოწმდება..." : "დადასტურება და რეგისტრაცია"}
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
              setStep("form");
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
      <div className="mb-6">
        <h1 className="text-center font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
          რეგისტრაცია
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelClassName}>
              სახელი
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={inputClassName}
              placeholder="მაგ: გიორგი"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={labelClassName}>
              გვარი
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={inputClassName}
              placeholder="მაგ: ბერიძე"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={labelClassName}>
            ტელეფონის ნომერი
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={inputClassName}
            placeholder="მაგ: 5XX XX XX XX"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className={labelClassName}>
            მისამართი
          </label>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            className={inputClassName}
            placeholder="ქალაქი, ქუჩა, ნომერი"
            {...register("address")}
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="birthDate" className={labelClassName}>
            დაბადების თარიღი
          </label>
          <input
            id="birthDate"
            type="date"
            className={inputClassName}
            {...register("birthDate")}
          />
          {errors.birthDate && (
            <p className="mt-1 text-xs text-red-500">
              {errors.birthDate.message}
            </p>
          )}
        </div>

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

        <div className="flex flex-row flex-wrap gap-2 md:flex-nowrap">
          <div className="w-full md:w-1/2">
            <label
              htmlFor="password"
              className="mb-1.5 flex min-h-[2.75rem] items-end font-[family-name:var(--font-inter)] text-[18px] font-medium leading-tight text-neutral-700 md:min-h-[3rem] md:text-[20px]"
            >
              პაროლი
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              placeholder="მინიმუმ 6 სიმბოლო"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="w-full md:w-1/2">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 flex min-h-[2.75rem] items-end font-[family-name:var(--font-inter)] text-[18px] font-medium leading-tight text-neutral-700 md:min-h-[3rem] md:text-[20px]"
            >
              პაროლის დადასტურება
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              placeholder="გაიმეორე პაროლი"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
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

      <p className="mt-6 text-center text-sm text-neutral-500">
        უკვე გაქვს ანგარიში?{" "}
        <Link
          href="/login"
          className="font-medium text-[#FF0050] hover:underline"
        >
          შესვლა
        </Link>
      </p>
    </div>
  );
}
