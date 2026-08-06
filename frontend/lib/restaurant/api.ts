import { apiFetch } from "@/lib/api";
import type {
  AnalyticsData,
  DashboardStats,
  MenuCategory,
  OwnerProfile,
  PopularProduct,
  ProductCategory,
  ProductWritePayload,
  RestaurantOrder,
  RestaurantProduct,
  RestaurantReview,
  RestaurantSettings,
  RestaurantSummary,
} from "./types";
import type { OrderStatus } from "./types";

export function parseApiError(data: unknown, fallback = "Request failed"): string {
  if (!data || typeof data !== "object") return fallback;
  const msg = (data as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  if (typeof msg === "string") return msg;
  return fallback;
}

export const restaurantApi = {
  dashboard: () =>
    apiFetch<{
      restaurant: RestaurantSummary;
      activeOrdersCount: number;
      stats: DashboardStats;
      recentOrders: RestaurantOrder[];
      latestReviews: RestaurantReview[];
      popularProducts: PopularProduct[];
    }>("/restaurant/dashboard"),

  analytics: () => apiFetch<AnalyticsData>("/restaurant/analytics"),

  menu: () =>
    apiFetch<{
      restaurant: RestaurantSummary;
      menu: MenuCategory[];
      categories: ProductCategory[];
    }>("/restaurant/menu"),

  toggleMenuVisibility: (id: string, visible: boolean) =>
    apiFetch<{ menu: MenuCategory[] }>(`/restaurant/menu/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visible }),
    }),

  categories: () =>
    apiFetch<{ restaurant: RestaurantSummary; categories: ProductCategory[] }>(
      "/restaurant/categories",
    ),

  createCategory: (data: { name: string; sortOrder?: number }) =>
    apiFetch<{ category: ProductCategory }>("/restaurant/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { name?: string; sortOrder?: number }) =>
    apiFetch<{ category: ProductCategory }>(`/restaurant/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    apiFetch<{ ok: boolean }>(`/restaurant/categories/${id}`, {
      method: "DELETE",
    }),

  reorderCategories: (ids: string[]) =>
    apiFetch<{ categories: ProductCategory[] }>(
      "/restaurant/categories/reorder",
      {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      },
    ),

  products: () =>
    apiFetch<{
      restaurant: RestaurantSummary;
      products: RestaurantProduct[];
      categories: ProductCategory[];
    }>("/restaurant/products"),

  createProduct: (data: ProductWritePayload) =>
    apiFetch<{ product: RestaurantProduct }>("/restaurant/products", {
      method: "POST",
      body: JSON.stringify({ ...data, variants: data.variants ?? [] }),
    }),

  updateProduct: (id: string, data: ProductWritePayload) =>
    apiFetch<{ product: RestaurantProduct }>(`/restaurant/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...data, variants: data.variants ?? [] }),
    }),

  deleteProduct: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/restaurant/products/${id}`, {
      method: "DELETE",
    }),

  duplicateProduct: (id: string) =>
    apiFetch<{ product: RestaurantProduct }>(
      `/restaurant/products/${id}/duplicate`,
      { method: "POST" },
    ),

  orders: () =>
    apiFetch<{ restaurant: RestaurantSummary; orders: RestaurantOrder[] }>(
      "/restaurant/orders",
    ),

  order: (id: string) =>
    apiFetch<{ order: RestaurantOrder }>(`/restaurant/orders/${id}`),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    apiFetch<{ order: RestaurantOrder }>(`/restaurant/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  reviews: () =>
    apiFetch<{ restaurant: RestaurantSummary; reviews: RestaurantReview[] }>(
      "/restaurant/reviews",
    ),

  deleteReview: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/restaurant/reviews/${id}`, {
      method: "DELETE",
    }),

  settings: () =>
    apiFetch<{ settings: RestaurantSettings }>("/restaurant/settings"),

  updateSettings: (data: Partial<RestaurantSettings>) =>
    apiFetch<{ settings: RestaurantSettings }>("/restaurant/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  account: () => apiFetch<{ user: OwnerProfile }>("/restaurant/account"),

  updateAccount: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    apiFetch<{ user: OwnerProfile }>("/restaurant/account", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  createRestaurant: (data: {
    name: string;
    slug: string;
    description?: string;
    categories: string[];
    city: string;
    street: string;
    phone: string;
    email?: string;
    logo?: string | null;
    coverImage?: string | null;
    latitude?: string;
    longitude?: string;
  }) =>
    apiFetch<{ restaurant: RestaurantSummary }>("/restaurant/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
