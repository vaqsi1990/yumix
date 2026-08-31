"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminUserDetailPage from "@/components/admin/AdminUserDetailPage";
import { ROLE_KA } from "@/lib/admin/labels";
import { adminTextClass as textClass } from "@/lib/admin/typography";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { adminUserCreateSchema } from "@/lib/validation/admin";

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string | Date;
  _count: { orders: number };
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

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "USER",
  isActive: true,
};

const ROLES: Role[] = ["USER", "COURIER", "RESTAURANT_OWNER", "ADMIN"];

const inputClass =
  `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

const roleSelectClass = `w-full min-w-0 rounded-md border border-neutral-200 bg-white px-2 py-1.5 ${textClass}`;

function UserActions({
  user,
  expanded,
  currentUserId,
  deletingId,
  onEdit,
  onDelete,
  onToggle,
}: {
  user: AdminUserRow;
  expanded: boolean;
  currentUserId: string;
  deletingId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:justify-start md:flex-wrap md:gap-2">
      <button
        type="button"
        onClick={onEdit}
        className={`rounded-md border border-neutral-200 bg-white px-3.5 py-2 text-[15px] font-medium text-neutral-700 hover:bg-neutral-50 md:px-2.5 md:py-1.5 ${textClass}`}
      >
        რედაქტირება
      </button>
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <button
          type="button"
          disabled={user.id === currentUserId || deletingId === user.id}
          onClick={onDelete}
          aria-label="წაშლა"
          className="inline-flex size-9 items-center justify-center rounded-md text-[#FF0050] transition hover:bg-[#FF0050]/10 disabled:opacity-40"
        >
          {deletingId === user.id ? (
            <span className="text-[16px]">...</span>
          ) : (
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide details" : "Show details"}
          className="inline-flex size-9 items-center justify-center rounded-md text-[#FF0050] transition hover:bg-[#FF0050]/10"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

function RoleSelect({
  user,
  onRoleChange,
}: {
  user: AdminUserRow;
  onRoleChange: (user: AdminUserRow, role: Role) => void;
}) {
  return (
    <select
      value={user.role}
      onChange={(e) => onRoleChange(user, e.target.value as Role)}
      className={roleSelectClass}
      aria-label={`${user.firstName} ${user.lastName} — როლი`}
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_KA[role]}
        </option>
      ))}
    </select>
  );
}

export default function AdminUsersManager({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editOnExpandId, setEditOnExpandId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setEditOnExpandId((editId) =>
      expandedIds.has(id) && editId === id ? null : editId,
    );
  }

  function expandWithEdit(id: string) {
    setExpandedIds((prev) => new Set(prev).add(id));
    setEditOnExpandId(id);
  }

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const parsed = adminUserCreateSchema.safeParse({
        ...form,
        password: form.password || undefined,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
        setLoading(false);
        return;
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        isActive: form.isActive,
        password: form.password,
      };

      const res = await fetch("/api/backend/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "შეცდომა");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("ქსელი შეცდომა");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(user: AdminUserRow) {
    if (user.id === currentUserId) return;
    const ok = window.confirm(
      `წაშალო ${user.firstName} ${user.lastName}?`,
    );
    if (!ok) return;

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/backend/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        error?: string;
        softDeleted?: boolean;
        message?: string;
      };
      if (!res.ok) {
        alert(data.error || "წაშლა ვერ მოხერხდა");
        return;
      }
      if (data.softDeleted) {
        alert(
          "მომხმარებელს აქვს ჩანაწერები, ამიტომ გათიშულია",
        );
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function onRoleChange(user: AdminUserRow, role: Role) {
    if (user.role === role) return;
    if (user.id === currentUserId && role !== "ADMIN") {
      alert(
        "საკუთარი როლის შეცვლა შეუძლებელია",
      );
      return;
    }

    const res = await fetch(`/api/backend/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error || "როლის შეცვლა ვერ მოხერხდა");
      return;
    }
    router.refresh();
  }

  return (
    <div className={textClass}>
      <div className="mb-4 flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={openCreate}
          className={`w-full rounded-lg bg-[#FF0050] px-4 py-2.5 ${textClass} font-medium text-white transition hover:bg-[#e00048] sm:w-auto`}
        >
          + ახალი მომხმარებელი
        </button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 px-4 py-8 text-center text-neutral-500">
          მომხმარებლები ჯერ არ არის
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => {
              const expanded = expandedIds.has(user.id);

              return (
                <Fragment key={user.id}>
                  <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="space-y-3 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 truncate text-[14px] text-neutral-600">
                            {user.email}
                          </p>
                          <p className="truncate text-[14px] text-neutral-600">
                            {user.phone}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                            user.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {user.isActive ? "აქტიური" : "გათიშული"}
                        </span>
                      </div>

                      <RoleSelect user={user} onRoleChange={onRoleChange} />

                      <UserActions
                        user={user}
                        expanded={expanded}
                        currentUserId={currentUserId}
                        deletingId={deletingId}
                        onEdit={() => expandWithEdit(user.id)}
                        onDelete={() => void onDelete(user)}
                        onToggle={() => toggleExpanded(user.id)}
                      />
                    </div>

                    {expanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/80 p-3 sm:p-4">
                        <AdminUserDetailPage
                          key={
                            editOnExpandId === user.id
                              ? `${user.id}-edit`
                              : user.id
                          }
                          userId={user.id}
                          currentUserId={currentUserId}
                          initialEdit={editOnExpandId === user.id}
                          embedded
                        />
                      </div>
                    )}
                  </article>
                </Fragment>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 text-[16px] md:block">
            <table className={`min-w-full text-left ${textClass}`}>
              <thead className="bg-[#F3F4F6] text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">სახელი</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">
                    ელფოსტა
                  </th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">
                    ტელეფონი
                  </th>
                  <th className="px-4 py-3 font-medium">როლი</th>
                  <th className="px-4 py-3 font-medium">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const expanded = expandedIds.has(user.id);

                  return (
                    <Fragment key={user.id}>
                      <tr className="border-t border-neutral-100">
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          <div className="min-w-[120px]">
                            <p>
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="mt-0.5 truncate text-[14px] font-normal text-neutral-500 lg:hidden">
                              {user.email}
                            </p>
                            <p className="truncate text-[14px] font-normal text-neutral-500 xl:hidden lg:block">
                              {user.phone}
                            </p>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {user.email}
                        </td>
                        <td className="hidden px-4 py-3 xl:table-cell">
                          {user.phone}
                        </td>
                        <td className="px-4 py-3">
                          <RoleSelect user={user} onRoleChange={onRoleChange} />
                        </td>
                        <td className="px-4 py-3">
                          <UserActions
                            user={user}
                            expanded={expanded}
                            currentUserId={currentUserId}
                            deletingId={deletingId}
                            onEdit={() => expandWithEdit(user.id)}
                            onDelete={() => void onDelete(user)}
                            onToggle={() => toggleExpanded(user.id)}
                          />
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-neutral-100 bg-neutral-50/80">
                          <td colSpan={5} className="p-4">
                            <AdminUserDetailPage
                              key={
                                editOnExpandId === user.id
                                  ? `${user.id}-edit`
                                  : user.id
                              }
                              userId={user.id}
                              currentUserId={currentUserId}
                              initialEdit={editOnExpandId === user.id}
                              embedded
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={close}
        >
          <div
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={`${textClass} font-bold text-neutral-900`}>
                ახალი მომხმარებელი
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-md px-2 py-1 text-neutral-500 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className={`grid gap-1 ${textClass}`}>
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
              <label className={`grid gap-1 ${textClass}`}>
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
              <label className={`grid gap-1 ${textClass} sm:col-span-2`}>
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
              <label className={`grid gap-1 ${textClass}`}>
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
              <label className={`grid gap-1 ${textClass}`}>
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
              <label className={`grid gap-1 ${textClass} sm:col-span-2`}>
                <span className="text-neutral-600">პაროლი</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  className={inputClass}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </label>
              <label className={`flex items-center gap-2 ${textClass} sm:col-span-2`}>
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
                <p className={`sm:col-span-2 text-[16px] ${textClass} text-[#FF0050]`}>{error}</p>
              )}

              <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className={`rounded-lg border border-neutral-200 px-4 py-2.5 ${textClass}`}
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-lg bg-[#FF0050] px-4 py-2.5 ${textClass} font-medium text-white disabled:opacity-60`}
                >
                  {loading ? "..." : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
