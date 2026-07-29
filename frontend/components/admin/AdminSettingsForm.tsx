"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { formatDateTime } from "@/lib/admin/format";
import { ROLE_KA } from "@/lib/admin/labels";
import { adminSettingsSchema } from "@/lib/validation/admin";
import { adminTextClass as textClass } from "@/lib/admin/typography";

type Role = "USER" | "COURIER" | "RESTAURANT_OWNER" | "ADMIN";

export type AdminProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string | Date | null;
  role: Role;
  createdAt: string | Date;
};

const inputClass = `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

function toDateInput(value: string | Date | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AdminSettingsForm({
  profile,
}: {
  profile: AdminProfile;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    birthDate: toDateInput(profile.birthDate),
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = adminSettingsSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/backend/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          birthDate: form.birthDate || null,
          ...(form.newPassword
            ? {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
              }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        passwordChanged?: boolean;
        user?: {
          firstName: string;
          lastName: string;
          email: string;
        };
      };

      if (!res.ok) {
        setError(data.error || "შენახვა ვერ მოხერხდა");
        return;
      }

      if (data.user) {
        await refresh();
      }

      setForm((f) => ({
        ...f,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSuccess(
        data.passwordChanged
          ? "მონაცემები და პაროლი განახლდა"
          : "მონაცემები შენახულია",
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`mx-auto max-w-2xl space-y-6 ${textClass}`}>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-bold text-neutral-900">პირადი მონაცემები</h2>
        <p className="mt-1 text-[16px]  text-neutral-500">
          როლი: {ROLE_KA[profile.role]} · რეგისტრაცია:{" "}
          {formatDateTime(profile.createdAt)}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-neutral-600">სახელი</span>
            <input
              required
              className={inputClass}
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">გვარი</span>
            <input
              required
              className={inputClass}
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-neutral-600">ელფოსტა</span>
            <input
              required
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">ტელეფონი</span>
            <input
              required
              className={inputClass}
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">დაბადების თარიღი</span>
            <input
              type="date"
              className={inputClass}
              value={form.birthDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthDate: e.target.value }))
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-bold text-neutral-900">პაროლის შეცვლა</h2>
        <p className="mt-1 text-[16px] md:text-[18px] text-neutral-500">
          ცარიელი დატოვე, თუ პაროლის შეცვლა არ გინდა
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-neutral-600">მიმდინარე პაროლი</span>
            <input
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={form.currentPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">ახალი პაროლი</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={6}
              className={inputClass}
              value={form.newPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, newPassword: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">გაიმეორე ახალი პაროლი</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={6}
              className={inputClass}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
            />
          </label>
        </div>
      </section>

      {error && <p className="text-[#FF0050]">{error}</p>}
      {success && <p className="text-[#15803D]">{success}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#FF0050] px-5 py-2.5 font-medium text-white transition hover:bg-[#e00048] disabled:opacity-60"
        >
          {loading ? "ინახება..." : "შენახვა"}
        </button>
      </div>
    </form>
  );
}
