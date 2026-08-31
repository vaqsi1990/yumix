"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { ORDER_STATUS_KA, ROLE_KA, VEHICLE_KA } from "@/lib/admin/labels";
import { adminTextClass as textClass } from "@/lib/admin/typography";
import type { OrderStatus, Role } from "@/lib/types";
import { adminUserUpdateSchema } from "@/lib/validation/admin";

export type AdminUserDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string | Date | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  addresses: {
    id: string;
    title: string;
    city: string;
    street: string;
    building: string | null;
    isDefault: boolean;
  }[];
  restaurants: {
    id: string;
    name: string;
    city: string;
    isApproved: boolean;
    isOpen: boolean;
  }[];
  courier: {
    id: string;
    vehicleType: keyof typeof VEHICLE_KA;
    isOnline: boolean;
    rating: number | null;
  } | null;
  orders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: string | Date;
    restaurant: { id: string; name: string };
  }[];
  _count: {
    orders: number;
    deliveries: number;
    restaurants: number;
    reviews: number;
    addresses: number;
  };
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  isActive: boolean;
};

const ROLES: Role[] = ["USER", "COURIER", "RESTAURANT_OWNER", "ADMIN"];

const inputClass =
  `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

type AdminUserDetailViewProps = {
  user: AdminUserDetail;
  currentUserId: string;
  initialEdit?: boolean;
  onUserUpdated?: (user: AdminUserDetail) => void;
};

export default function AdminUserDetailView({
  user,
  currentUserId,
  initialEdit = false,
  onUserUpdated,
}: AdminUserDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(initialEdit);
  const [form, setForm] = useState<FormState>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    password: "",
    role: user.role,
    isActive: user.isActive,
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fullName = useMemo(
    () => `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName],
  );

  function cancelEdit() {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setError("");
    setEditing(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const parsed = adminUserUpdateSchema.safeParse({
        ...form,
        password: form.password || undefined,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
        return;
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      };

      const res = await fetch(`/api/backend/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; user?: AdminUserDetail };
      if (!res.ok) {
        setError(data.error || "შეცდომა");
        return;
      }

      const detailRes = await fetch(`/api/backend/admin/users/${user.id}`);
      if (detailRes.ok) {
        const detailData = (await detailRes.json()) as { user: AdminUserDetail };
        onUserUpdated?.(detailData.user);
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("ქსელი შეცდომა");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (user.id === currentUserId) return;
    const ok = window.confirm(`წაშალო ${fullName}?`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/backend/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        error?: string;
        softDeleted?: boolean;
      };
      if (!res.ok) {
        alert(data.error || "წაშლა ვერ მოხერხდა");
        return;
      }
      if (data.softDeleted) {
        alert("მომხმარებელს აქვს ჩანაწერები, ამიტომ გათიშულია");
        router.refresh();
        const detailRes = await fetch(`/api/backend/admin/users/${user.id}`);
        if (detailRes.ok) {
          const detailData = (await detailRes.json()) as { user: AdminUserDetail };
          onUserUpdated?.(detailData.user);
        }
        return;
      }
      router.push("/admin/users");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`space-y-6 ${textClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">{fullName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[14px] font-medium text-neutral-700">
              {ROLE_KA[user.role]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[14px] font-medium ${
                user.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {user.isActive ? "აქტიური" : "გათიშული"}
            </span>
            {user.emailVerified && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[14px] text-blue-700">
                ელფოსტა დადასტურებული
              </span>
            )}
            {user.phoneVerified && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[14px] text-blue-700">
                ტელეფონი დადასტურებული
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`rounded-lg border border-neutral-200 bg-white px-4 py-2.5 ${textClass} font-medium text-neutral-700 transition hover:bg-neutral-50`}
            >
              რედაქტირება
            </button>
          ) : null}
          <button
            type="button"
            disabled={user.id === currentUserId || deleting}
            onClick={() => void onDelete()}
            className={`rounded-lg border border-[#FF0050]/30 px-4 py-2.5 ${textClass} font-medium text-[#FF0050] transition hover:bg-[#FF0050]/10 disabled:opacity-40`}
          >
            {deleting ? "..." : "წაშლა"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "შეკვეთები", value: user._count.orders.toString() },
          { label: "მიწოდებები", value: user._count.deliveries.toString() },
          { label: "რესტორნები", value: user._count.restaurants.toString() },
          { label: "მისამართები", value: user._count.addresses.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <p className="text-[14px] text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">რედაქტირება</h3>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
              <span className="text-neutral-600">როლი</span>
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as Role }))
                }
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_KA[role]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-neutral-600">ახალი პაროლი (არასავალდებულო)</span>
              <input
                type="password"
                minLength={6}
                className={inputClass}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <span>აქტიური ანგარიში</span>
            </label>

            {error && (
              <p className="sm:col-span-2 text-[16px] text-[#FF0050]">{error}</p>
            )}

            <div className="mt-1 flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={cancelEdit}
                className={`rounded-lg border border-neutral-200 px-4 py-2.5 ${textClass}`}
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`rounded-lg bg-[#FF0050] px-4 py-2.5 ${textClass} font-medium text-white disabled:opacity-60`}
              >
                {loading ? "..." : "შენახვა"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">პროფილი</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "ელფოსტა", value: user.email },
              { label: "ტელეფონი", value: user.phone },
              {
                label: "დაბადების თარიღი",
                value: user.birthDate ? formatDateTime(user.birthDate) : "—",
              },
              { label: "რეგისტრაცია", value: formatDateTime(user.createdAt) },
              { label: "განახლება", value: formatDateTime(user.updatedAt) },
              { label: "მიმოხილვები", value: user._count.reviews.toString() },
            ].map((row) => (
              <div key={row.label}>
                <dt className="text-[14px] text-neutral-500">{row.label}</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {user.courier && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">კურიერი</h3>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[14px] text-neutral-500">ტრანსპორტი</dt>
              <dd className="mt-0.5 font-medium">
                {VEHICLE_KA[user.courier.vehicleType]}
              </dd>
            </div>
            <div>
              <dt className="text-[14px] text-neutral-500">ონლაინ</dt>
              <dd className="mt-0.5 font-medium">
                {user.courier.isOnline ? "კი" : "არა"}
              </dd>
            </div>
            <div>
              <dt className="text-[14px] text-neutral-500">რეიტინგი</dt>
              <dd className="mt-0.5 font-medium">
                {user.courier.rating != null ? user.courier.rating.toFixed(1) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {user.restaurants.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">რესტორნები</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">სახელი</th>
                  <th className="px-3 py-2 font-medium">ქალაქი</th>
                  <th className="px-3 py-2 font-medium">სტატუსი</th>
                </tr>
              </thead>
              <tbody>
                {user.restaurants.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/restaurants/${r.id}`}
                        className="font-medium text-[#FF0050] hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.city}</td>
                    <td className="px-3 py-2">
                      {r.isApproved
                        ? r.isOpen
                          ? "ღია"
                          : "დაკეტილი"
                        : "დასადასტურებელი"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.addresses.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">მისამართები</h3>
          <ul className="space-y-3">
            {user.addresses.map((addr) => (
              <li
                key={addr.id}
                className="rounded-lg border border-neutral-100 px-4 py-3"
              >
                <p className="font-medium">
                  {addr.title}
                  {addr.isDefault ? (
                    <span className="ml-2 text-[14px] text-neutral-500">(ძირითადი)</span>
                  ) : null}
                </p>
                <p className="mt-1 text-neutral-600">
                  {addr.city}, {addr.street}
                  {addr.building ? ` ${addr.building}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-neutral-900">
            შეკვეთები ({user._count.orders})
          </h3>
          <Link
            href="/admin/orders"
            className="text-[16px] font-medium text-[#FF0050] hover:underline"
          >
            ყველა შეკვეთა →
          </Link>
        </div>

        {user.orders.length === 0 ? (
          <p className="py-6 text-center text-neutral-500">შეკვეთები ჯერ არ არის</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#F3F4F6] text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">№</th>
                  <th className="px-4 py-3 font-medium">რესტორანი</th>
                  <th className="px-4 py-3 font-medium">სტატუსი</th>
                  <th className="px-4 py-3 font-medium">თანხა</th>
                  <th className="px-4 py-3 font-medium">თარიღი</th>
                </tr>
              </thead>
              <tbody>
                {user.orders.map((order) => (
                  <tr key={order.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-mono text-[14px]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/restaurants/${order.restaurant.id}`}
                        className="text-[#FF0050] hover:underline"
                      >
                        {order.restaurant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[14px]">
                        {ORDER_STATUS_KA[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatGel(order.total)}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
