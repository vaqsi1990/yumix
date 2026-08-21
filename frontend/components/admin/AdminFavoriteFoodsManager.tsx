"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/admin/restaurants/form/ImageUploadField";
import { parseApiError } from "@/lib/admin/api";
import { adminTextClass as textClass } from "@/lib/admin/typography";
import { RESTAURANT_CATEGORY_DEFS } from "@/lib/restaurant-categories";

export type AdminFavoriteFood = {
  id: string;
  slug: string;
  label: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
};

const inputClass = `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

const emptyForm = {
  slug: "",
  label: "",
  image: "",
  isActive: true,
};

export default function AdminFavoriteFoodsManager({
  items: initialItems,
}: {
  items: AdminFavoriteFood[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usedSlugs = useMemo(
    () => new Set(items.filter((item) => item.id !== editingId).map((i) => i.slug)),
    [items, editingId],
  );

  const categoryOptions = useMemo(
    () =>
      RESTAURANT_CATEGORY_DEFS.filter(
        (category) => !usedSlugs.has(category.slug) || category.slug === form.slug,
      ),
    [usedSlugs, form.slug],
  );

  function applyCategory(slug: string) {
    const def = RESTAURANT_CATEGORY_DEFS.find((c) => c.slug === slug);
    setForm((f) => ({
      ...f,
      slug,
      label: def?.label ?? f.label,
      image: def?.image || f.image || "/rest/1.jpg",
    }));
  }

  function startEdit(item: AdminFavoriteFood) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      label: item.label,
      image: item.image,
      isActive: item.isActive,
    });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.slug || !form.label.trim() || !form.image.trim()) {
      setError("აირჩიე კატეგორია, სახელი და სურათი");
      return;
    }

    setLoading(true);
    try {
      const url = editingId
        ? `/api/backend/admin/favorite-foods/${editingId}`
        : "/api/backend/admin/favorite-foods";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          label: form.label.trim(),
          image: form.image.trim(),
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "შენახვა ვერ მოხერხდა"));
        return;
      }
      const data = (await res.json()) as {
        item?: AdminFavoriteFood;
      };
      if (data.item) {
        setItems((prev) => {
          if (editingId) {
            return prev.map((row) => (row.id === editingId ? data.item! : row));
          }
          return [...prev, data.item!];
        });
      }
      resetForm();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder(next: AdminFavoriteFood[]) {
    setItems(next);
    const res = await fetch("/api/backend/admin/favorite-foods/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
    if (!res.ok) {
      setError(await parseApiError(res, "რიგის შენახვა ვერ მოხერხდა"));
      router.refresh();
      return;
    }
    router.refresh();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    void persistOrder(next);
  }

  async function toggleActive(item: AdminFavoriteFood) {
    const res = await fetch(`/api/backend/admin/favorite-foods/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (!res.ok) {
      setError(await parseApiError(res, "განახლება ვერ მოხერხდა"));
      return;
    }
    const data = (await res.json()) as { item: AdminFavoriteFood };
    setItems((prev) => prev.map((row) => (row.id === item.id ? data.item : row)));
    router.refresh();
  }

  async function remove(item: AdminFavoriteFood) {
    if (!window.confirm(`წავშალოთ „${item.label}“?`)) return;
    const res = await fetch(`/api/backend/admin/favorite-foods/${item.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    if (editingId === item.id) resetForm();
    router.refresh();
  }

  return (
    <div className={`space-y-6 ${textClass}`}>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-5"
      >
        <h2 className="font-bold text-neutral-900">
          {editingId ? "რედაქტირება" : "ახალი საკვები"}
        </h2>
        <p className="mt-1 text-neutral-500">
          აირჩიე კატეგორია, რომელიც გამოჩნდება მთავარ გვერდზე „სასურველი საკვები“
          სექციაში.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_200px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-neutral-600">კატეგორია</span>
              <select
                required
                className={inputClass}
                value={form.slug}
                onChange={(e) => applyCategory(e.target.value)}
              >
                <option value="">აირჩიე კატეგორია</option>
                {categoryOptions.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-neutral-600">სახელი</span>
              <input
                required
                className={inputClass}
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
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
              <span className="text-neutral-600">გამოჩნდეს საიტზე</span>
            </label>
          </div>
          <ImageUploadField
            label="სურათი"
            value={form.image || null}
            onChange={(url) => setForm((f) => ({ ...f, image: url ?? "" }))}
          />
        </div>

        {error && <p className="mt-3 text-[#FF0050]">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#FF0050] px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "ინახება..." : editingId ? "განახლება" : "დამატება"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-neutral-700"
            >
              გაუქმება
            </button>
          )}
        </div>
      </form>

      <section className="rounded-2xl border border-neutral-200 bg-white">
        {items.length === 0 ? (
          <p className="p-5 text-neutral-500">
            ჯერ არაფერია არჩეული. დაამატე კატეგორიები, რომ სექცია გამოჩნდეს მთავარ
            გვერდზე.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">
                    {item.label}
                  </p>
                  <p className="truncate text-neutral-500">
                    /categories/{item.slug}
                    {item.isActive ? "" : " · დამალული"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="ზემოთ"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="ქვემოთ"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(item)}
                    className="hidden rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100 sm:inline"
                  >
                    {item.isActive ? "დამალვა" : "ჩვენება"}
                  </button>
                  <button
                    type="button"
                    aria-label="რედაქტირება"
                    onClick={() => startEdit(item)}
                    className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="წაშლა"
                    onClick={() => void remove(item)}
                    className="rounded-md p-2 text-[#FF0050] hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
