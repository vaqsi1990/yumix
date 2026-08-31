"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_KA } from "@/lib/admin/labels";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import type { Role } from "@/lib/types";
import { adminCouponSchema } from "@/lib/validation/admin";
import { adminTextClass as textClass } from "@/lib/admin/typography";

export type AdminCouponRow = {
  id: string;
  code: string;
  value: number;
  remainingBalance: number;
  expiresAt: string | Date | null;
  isActive: boolean;
  note: string | null;
  createdAt: string | Date;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count: { usages: number };
};

export type AssignableUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
};

const inputClass = `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

function userLabel(user: AssignableUser | AdminCouponRow["assignedTo"]) {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`;
}

function matchesUser(user: AssignableUser, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  return (
    fullName.includes(q) ||
    user.firstName.toLowerCase().includes(q) ||
    user.lastName.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  );
}

function UserSearchPicker({
  users,
  selectedId,
  selectedLabel,
  onSelect,
  required,
  compact,
  placeholder = "სახელი, გვარი ან მეილი",
}: {
  users: AssignableUser[];
  selectedId: string;
  selectedLabel?: string;
  onSelect: (user: AssignableUser | null) => void;
  required?: boolean;
  compact?: boolean;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedId && selectedLabel) {
      setQuery(selectedLabel);
    } else if (!selectedId) {
      setQuery("");
    }
  }, [selectedId, selectedLabel]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (selectedId && selectedLabel) setQuery(selectedLabel);
        else if (!selectedId) setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selectedId, selectedLabel]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return users.filter((u) => matchesUser(u, query)).slice(0, 8);
  }, [users, query]);

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        required={required && !selectedId}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        className={
          compact
            ? "w-full min-w-[180px] max-w-[240px] rounded-md border border-neutral-200 bg-white px-2 py-1.5 outline-none focus:border-[#FF0050]"
            : inputClass
        }
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setOpen(true);
          if (selectedId && value !== selectedLabel) {
            onSelect(null);
          }
        }}
      />

      {selectedId && selectedLabel && (
        <p className={`mt-1 text-neutral-500 ${textClass}`}>
          არჩეული: {selectedLabel}
        </p>
      )}

      {open && query.trim() && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-[16px]  text-neutral-500">
              ვერ მოიძებნა
            </li>
          ) : (
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-[#F5F5F5]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(user);
                    setQuery(userLabel(user));
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-neutral-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[16px]  text-neutral-500">
                    {user.email} · {ROLE_KA[user.role]}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function AdminCouponsManager({
  coupons,
  users,
}: {
  coupons: AdminCouponRow[];
  users: AssignableUser[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    value: "",
    assignedToId: "",
    assignedLabel: "",
    expiresAt: "",
    note: "",
  });

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
          "ka",
        ),
      ),
    [users],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = adminCouponSchema.safeParse({
      code: form.code || undefined,
      value: Number(form.value),
      assignedToId: form.assignedToId,
      expiresAt: form.expiresAt || null,
      note: form.note || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/backend/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "შეცდომა");
        return;
      }
      setOpen(false);
      setForm({
        code: "",
        value: "",
        assignedToId: "",
        assignedLabel: "",
        expiresAt: "",
        note: "",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function reassign(id: string, assignedToId: string) {
    const res = await fetch(`/api/backend/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error || "მინიჭება ვერ მოხერხდა");
      return;
    }
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/backend/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <div className={textClass}>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#FF0050] px-4 py-2.5 font-medium text-white transition hover:bg-[#e00048]"
        >
          + ახალი კუპონი
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className={`min-w-full text-left ${textClass}`}>
          <thead className="bg-[#F3F4F6] text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">კოდი</th>
              <th className="px-4 py-3 font-medium">თანამშრომელი</th>
              <th className="px-4 py-3 font-medium">ბალანსი</th>
              <th className="px-4 py-3 font-medium">გამოყენება</th>
              <th className="px-4 py-3 font-medium">ვადა</th>
              <th className="px-4 py-3 font-medium">სტატუსი</th>
              <th className="px-4 py-3 font-medium">მოქმედება</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  კუპონები ჯერ არ არის
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{coupon.code}</td>
                  <td className="px-4 py-3">
                    <UserSearchPicker
                      users={sortedUsers}
                      compact
                      selectedId={coupon.assignedTo?.id ?? ""}
                      selectedLabel={
                        coupon.assignedTo
                          ? userLabel(coupon.assignedTo)
                          : undefined
                      }
                      onSelect={(user) => {
                        if (user) reassign(coupon.id, user.id);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatGel(coupon.remainingBalance)}</div>
                    <div className="text-[16px]  text-neutral-400">
                      საწყისი: {formatGel(coupon.value)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{coupon._count.usages}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {coupon.expiresAt
                      ? formatDateTime(coupon.expiresAt)
                      : "უვადო"}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.isActive && coupon.remainingBalance > 0
                      ? "აქტიური"
                      : "გათიშული / ამოწურული"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(coupon.id, coupon.isActive)
                      }
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[16px]  hover:bg-neutral-50"
                    >
                      {coupon.isActive ? "გათიშვა" : "ჩართვა"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="mb-4 font-bold text-neutral-900">
              ახალი კუპონი (ბალანსი)
            </h2>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid gap-1">
                <span className="text-neutral-600">თანამშრომელი</span>
                <UserSearchPicker
                  users={sortedUsers}
                  required
                  selectedId={form.assignedToId}
                  selectedLabel={form.assignedLabel || undefined}
                  onSelect={(user) =>
                    setForm((f) => ({
                      ...f,
                      assignedToId: user?.id ?? "",
                      assignedLabel: user ? userLabel(user) : "",
                    }))
                  }
                />
              </div>

              <label className="grid gap-1">
                <span className="text-neutral-600">თანხა (₾)</span>
                <input
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  className={inputClass}
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span className="text-neutral-600">
                  კოდი (არასავალდებულო)
                </span>
                <input
                  className={inputClass}
                  placeholder="ავტომატურად გენერირდება"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span className="text-neutral-600">ვადა</span>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiresAt: e.target.value }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span className="text-neutral-600">შენიშვნა</span>
                <input
                  className={inputClass}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </label>

              <p className="text-[16px]  text-neutral-500">
                კუპონი მრავალჯერ გამოიყენება, სანამ ბალანსი არ ამოიწურება ან
                ვადა არ გავა. ფარავს კერძებსა და მიწოდების საფასურს.
              </p>

              {error && <p className="text-[#FF0050]">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2.5"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#FF0050] px-4 py-2.5 font-medium text-white disabled:opacity-60"
                >
                  {loading ? "..." : "შექმნა და მინიჭება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
