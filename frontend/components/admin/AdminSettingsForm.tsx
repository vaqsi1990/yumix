"use client";

import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { formatDateTime } from "@/lib/admin/format";
import { ROLE_KA } from "@/lib/admin/labels";
import { adminSettingsSchema } from "@/lib/validation/admin";
import { adminTextClass as textClass } from "@/lib/admin/typography";
import {
  createAddress,
  updateAddress,
} from "@/lib/account-api";
import type { Address } from "@/lib/shop-api";

const LocationMapPicker = dynamic(
  () => import("@/components/maps/LocationMapPicker"),
  { ssr: false },
);

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

function toAddressForm(address: Address | null) {
  return {
    id: address?.id ?? null,
    city: address?.city || "თბილისი",
    street: address?.street ?? "",
    building: address?.building ?? "",
    apartment: address?.apartment ?? "",
    latitude: address?.latitude != null ? String(address.latitude) : "",
    longitude: address?.longitude != null ? String(address.longitude) : "",
  };
}

export default function AdminSettingsForm({
  profile,
  address: initialAddress,
}: {
  profile: AdminProfile;
  address: Address | null;
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
  const [address, setAddress] = useState(() => toAddressForm(initialAddress));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = adminSettingsSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
      return;
    }

    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);
    if (
      !address.street.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setError("აირჩიე მისამართი რუკაზე");
      return;
    }

    setLoading(true);
    try {
      const addressPayload = {
        title: "მთავარი",
        city: address.city.trim() || "თბილისი",
        street: address.street.trim(),
        building: address.building || null,
        apartment: address.apartment || null,
        latitude,
        longitude,
        isDefault: true,
      };

      const [res, addressResult] = await Promise.all([
        fetch("/api/backend/admin/settings", {
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
        }),
        address.id
          ? updateAddress(address.id, addressPayload)
          : createAddress(addressPayload),
      ]);
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

      setAddress((a) => ({
        ...a,
        id: addressResult.address.id,
        city: addressResult.address.city,
        street: addressResult.address.street,
      }));

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა");
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
        <h2 className="font-bold text-neutral-900">მისამართი</h2>
        <p className="mt-1 text-[16px] text-neutral-500">
          აირჩიე მისამართი რუკაზე
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-neutral-600">ქალაქი</span>
            <input
              required
              className={inputClass}
              value={address.city}
              onChange={(e) =>
                setAddress((a) => ({ ...a, city: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">ქუჩა</span>
            <input
              required
              className={inputClass}
              value={address.street}
              onChange={(e) =>
                setAddress((a) => ({ ...a, street: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">სახლი/№</span>
            <input
              className={inputClass}
              value={address.building}
              onChange={(e) =>
                setAddress((a) => ({ ...a, building: e.target.value }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-neutral-600">ბინა</span>
            <input
              className={inputClass}
              value={address.apartment}
              onChange={(e) =>
                setAddress((a) => ({ ...a, apartment: e.target.value }))
              }
            />
          </label>
          <div className="grid gap-1 sm:col-span-2">
            <span className="text-neutral-600">აირჩიე რუკაზე</span>
            <LocationMapPicker
              city={address.city}
              latitude={address.latitude}
              longitude={address.longitude}
              addressQuery={[address.street, address.city]
                .filter(Boolean)
                .join(", ")}
              onChange={(lat, lng) =>
                setAddress((a) => ({ ...a, latitude: lat, longitude: lng }))
              }
              onAddressResolved={(resolved) =>
                setAddress((a) => ({
                  ...a,
                  street: resolved.street || a.street,
                  city: resolved.city || a.city,
                }))
              }
            />
          </div>
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
