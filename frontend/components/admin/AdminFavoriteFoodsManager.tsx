"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseApiError } from "@/lib/admin/api";
import { formatGel } from "@/lib/admin/format";
import { adminTextClass as textClass } from "@/lib/admin/typography";
import { ADDON_CARRIER_PRODUCT_NAME } from "@/lib/addon-categories";

export type AdminFavoriteFoodProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  categoryName: string;
};

export type AdminFavoriteFood = {
  id: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  product: AdminFavoriteFoodProduct;
};

type CatalogProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  restaurantId: string;
};

type CatalogRestaurant = {
  id: string;
  name: string;
  slug: string;
};

const inputClass = `w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 ${textClass} outline-none transition focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20`;

const emptyForm = {
  productId: "",
  isActive: true,
};

function normalizeFavoriteFoodItem(
  item: unknown,
  products: CatalogProduct[] = [],
  restaurantNameById: Map<string, string> = new Map(),
): AdminFavoriteFood | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;

  if (typeof row.id !== "string" || typeof row.productId !== "string") {
    return null;
  }

  if (row.product && typeof row.product === "object") {
    const product = row.product as Record<string, unknown>;
    if (typeof product.name === "string") {
      return {
        id: row.id,
        productId: row.productId,
        sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
        isActive: row.isActive !== false,
        product: {
          id: typeof product.id === "string" ? product.id : row.productId,
          name: product.name,
          image: typeof product.image === "string" ? product.image : null,
          price: typeof product.price === "number" ? product.price : 0,
          discountPrice:
            typeof product.discountPrice === "number"
              ? product.discountPrice
              : null,
          restaurantId:
            typeof product.restaurantId === "string" ? product.restaurantId : "",
          restaurantName:
            typeof product.restaurantName === "string"
              ? product.restaurantName
              : "—",
          restaurantSlug:
            typeof product.restaurantSlug === "string"
              ? product.restaurantSlug
              : "",
          categoryName:
            typeof product.categoryName === "string"
              ? product.categoryName
              : "—",
        },
      };
    }
  }

  const catalogProduct = products.find((product) => product.id === row.productId);
  if (!catalogProduct) return null;

  return {
    id: row.id,
    productId: row.productId,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    isActive: row.isActive !== false,
    product: {
      id: catalogProduct.id,
      name: catalogProduct.name,
      image: catalogProduct.image,
      price: catalogProduct.price,
      discountPrice: catalogProduct.discountPrice,
      restaurantId: catalogProduct.restaurantId,
      restaurantName:
        restaurantNameById.get(catalogProduct.restaurantId) ?? "—",
      restaurantSlug: "",
      categoryName: "—",
    },
  };
}

export function normalizeFavoriteFoodItems(
  items: unknown[] | undefined,
  products: CatalogProduct[] = [],
  restaurantNameById: Map<string, string> = new Map(),
): AdminFavoriteFood[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) =>
      normalizeFavoriteFoodItem(item, products, restaurantNameById),
    )
    .filter((item): item is AdminFavoriteFood => item != null);
}

export default function AdminFavoriteFoodsManager({
  items: _initialItems,
}: {
  items: AdminFavoriteFood[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<AdminFavoriteFood[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [restaurants, setRestaurants] = useState<CatalogRestaurant[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const restaurantNameById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.name])),
    [restaurants],
  );

  const reloadItems = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/backend/admin/favorite-foods");
      if (!res.ok) {
        setError(await parseApiError(res, "სიის ჩატვირთვა ვერ მოხერხდა"));
        return;
      }
      const data = (await res.json()) as { items?: unknown[] };
      setItems(
        normalizeFavoriteFoodItems(
          data.items,
          products,
          restaurantNameById,
        ),
      );
    } finally {
      setListLoading(false);
    }
  }, [products, restaurantNameById]);

  useEffect(() => {
    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const res = await fetch("/api/backend/admin/products");
        if (!res.ok) return;
        const data = (await res.json()) as {
          products?: CatalogProduct[];
          restaurants?: CatalogRestaurant[];
        };
        setProducts(
          (data.products ?? []).filter(
            (product) => product.name !== ADDON_CARRIER_PRODUCT_NAME,
          ),
        );
        setRestaurants(data.restaurants ?? []);
      } finally {
        setCatalogLoading(false);
      }
    }

    void loadCatalog();
  }, []);

  useEffect(() => {
    if (catalogLoading) return;
    void reloadItems();
  }, [catalogLoading, reloadItems]);

  const usedProductIds = useMemo(
    () =>
      new Set(
        items
          .filter((item) => item.id !== editingId)
          .map((item) => item.productId),
      ),
    [items, editingId],
  );

  const productOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (usedProductIds.has(product.id) && product.id !== form.productId) {
          return false;
        }
        if (!q) return true;
        const restaurantName =
          restaurantNameById.get(product.restaurantId) ?? "";
        return (
          product.name.toLowerCase().includes(q) ||
          restaurantName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const restaurantA = restaurantNameById.get(a.restaurantId) ?? "";
        const restaurantB = restaurantNameById.get(b.restaurantId) ?? "";
        return (
          restaurantA.localeCompare(restaurantB, "ka") ||
          a.name.localeCompare(b.name, "ka")
        );
      });
  }, [products, usedProductIds, form.productId, search, restaurantNameById]);

  const selectedProduct = products.find(
    (product) => product.id === form.productId,
  );

  function startEdit(item: AdminFavoriteFood) {
    setEditingId(item.id);
    setForm({
      productId: item.productId,
      isActive: item.isActive,
    });
    setSearch("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSearch("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.productId) {
      setError("აირჩიე საჭმელი");
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
          productId: form.productId,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const msg = await parseApiError(res, "შენახვა ვერ მოხერხდა");
        if (
          msg.includes("expected string") ||
          msg.includes("კატეგორია") ||
          msg.includes("slug")
        ) {
          setError(
            "ბექენდი ძველი ვერსიისაა. გაჩერდი პორტ 3001-ზე პროცესი, შემდეგ გაუშვი: cd backend && npx prisma db execute --file prisma/migrate-favorite-foods-to-products.sql && npm run build && npm run start:dev",
          );
        } else {
          setError(msg);
        }
        return;
      }
      resetForm();
      await reloadItems();
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
      await reloadItems();
      return;
    }
    await reloadItems();
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
    const data = (await res.json()) as { item?: unknown };
    const normalized = normalizeFavoriteFoodItem(
      data.item,
      products,
      restaurantNameById,
    );
    if (!normalized) {
      await reloadItems();
      return;
    }
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? normalized : row)),
    );
    router.refresh();
  }

  async function remove(item: AdminFavoriteFood) {
    if (!window.confirm(`წავშალოთ „${item.product.name}“?`)) return;
    const res = await fetch(`/api/backend/admin/favorite-foods/${item.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    if (editingId === item.id) resetForm();
    await reloadItems();
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
          აირჩიე კონკრეტული საჭმელი, რომელიც გამოჩნდება მთავარ გვერდზე „სასურველი
          საკვები“ სექციაში.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_200px]">
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-neutral-600">ძებნა</span>
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="საჭმლის ან რესტორნის სახელი..."
              />
            </label>
            <label className="grid gap-1">
              <span className="text-neutral-600">საჭმელი *</span>
              <select
                required
                className={inputClass}
                value={form.productId}
                disabled={catalogLoading}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productId: e.target.value }))
                }
              >
                <option value="">
                  {catalogLoading ? "იტვირთება..." : "აირჩიე საჭმელი"}
                </option>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {restaurantNameById.get(product.restaurantId) ?? "—"} ·{" "}
                    {product.name} · {formatGel(product.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
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

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-sm font-medium text-neutral-700">გადახედვა</p>
            {selectedProduct ? (
              <div className="mt-3">
                <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-lg bg-white">
                  {selectedProduct.image ? (
                    <Image
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-neutral-400">
                      ფოტო არ არის
                    </div>
                  )}
                </div>
                <p className="mt-3 font-medium text-neutral-900">
                  {selectedProduct.name}
                </p>
                <p className="text-sm text-neutral-500">
                  {restaurantNameById.get(selectedProduct.restaurantId) ?? "—"}
                </p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {formatGel(selectedProduct.price)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                აირჩიე საჭმელი სიიდან
              </p>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-[#FF0050]">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading || catalogLoading}
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
        {listLoading ? (
          <p className="p-5 text-neutral-500">იტვირთება...</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-neutral-500">
            ჯერ არაფერია არჩეული. დაამატე საჭმელი, რომ სექცია გამოჩნდეს მთავარ
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
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-neutral-400">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">
                    {item.product.name}
                  </p>
                  <p className="truncate text-neutral-500">
                    {item.product.restaurantName} · {formatGel(item.product.price)}
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
