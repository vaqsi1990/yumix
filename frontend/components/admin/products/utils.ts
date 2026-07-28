import type { AdminProduct, ProductFilters, ProductSortOption } from "./types";

export function filterAndSortProducts(
  products: AdminProduct[],
  filters: Pick<
    ProductFilters,
    "search" | "restaurantId" | "categoryId" | "availability" | "sort"
  >,
): AdminProduct[] {
  let result = [...products];

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (filters.restaurantId) {
    result = result.filter((p) => p.restaurantId === filters.restaurantId);
  }

  if (filters.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId);
  }

  if (filters.availability) {
    result = result.filter((p) => p.availability === filters.availability);
  }

  result.sort((a, b) => compareProducts(a, b, filters.sort));
  return result;
}

function compareProducts(
  a: AdminProduct,
  b: AdminProduct,
  sort: ProductSortOption,
): number {
  switch (sort) {
    case "newest":
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "oldest":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "price_asc":
      return a.price - b.price;
    case "price_desc":
      return b.price - a.price;
    case "name":
      return a.name.localeCompare(b.name, "ka");
    default:
      return 0;
  }
}

export function paginateProducts<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; total: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    total,
  };
}

export function duplicateProduct(product: AdminProduct): AdminProduct {
  const now = new Date().toISOString();
  return {
    ...product,
    id: `prod_${Date.now()}`,
    name: `${product.name} (კოპია)`,
    createdAt: now,
    updatedAt: now,
  };
}

export function toggleProductAvailability(
  product: AdminProduct,
): AdminProduct {
  const next =
    product.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
  return {
    ...product,
    availability: next,
    isAvailable: next === "AVAILABLE",
    updatedAt: new Date().toISOString(),
  };
}
