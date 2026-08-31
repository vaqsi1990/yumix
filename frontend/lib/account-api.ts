import type { Address } from "@/lib/shop-api";
import type { PublicMenuProduct } from "@/lib/restaurants";

async function parseError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  const message = data.message ?? data.error;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return "მოთხოვნა ვერ შესრულდა";
}

export type UserPreferences = {
  orderUpdates: boolean;
  promotions: boolean;
  newRestaurants: boolean;
  discounts: boolean;
  language: "ka" | "en" | "ru";
  currency: "GEL";
};

export type AccountUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
};

export type RestaurantCard = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  categories: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number | null;
  minimumOrder: number | null;
  isOpen: boolean;
  deliveryTime: string;
  favoriteId?: string;
};

export type DashboardData = {
  user: Pick<AccountUser, "id" | "firstName" | "lastName" | "avatar">;
  defaultAddress: Address | null;
  activeOrder: {
    id: string;
    orderNumber: string;
    status: string;
    estimatedTime: number | null;
    total: number;
    restaurant: { id: string; name: string; slug: string; logo: string | null };
  } | null;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    restaurant: { id: string; name: string; slug: string; logo: string | null };
    items: Array<{ quantity: number; product: { id: string; name: string; image: string | null } }>;
  }>;
  favoriteRestaurants: RestaurantCard[];
  recommendedRestaurants: RestaurantCard[];
  unreadNotifications: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  estimatedTime: number | null;
  createdAt: string;
  restaurant: { id: string; name: string; slug: string; logo: string | null };
  itemCount?: number;
  previewItems?: Array<{
    quantity: number;
    product: { id: string; name: string; image: string | null };
  }>;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type FavoriteProduct = {
  favoriteId: string;
  id: string;
  name: string;
  image: string | null;
  price: number;
  discountPrice: number | null;
  outOfStock: boolean;
  restaurant: { id: string; name: string; slug: string; logo: string | null };
  variants: Array<{ id: string; name: string; price: number }>;
  customizationGroups?: PublicMenuProduct["customizationGroups"];
};

export async function fetchAccountDashboard() {
  const res = await fetch("/api/backend/account/dashboard");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<DashboardData>;
}

export async function fetchAccountProfile() {
  const res = await fetch("/api/backend/account/profile");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ user: AccountUser }>;
}

export async function updateAccountProfile(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  currentPassword?: string;
  newPassword?: string;
}) {
  const res = await fetch("/api/backend/account/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ user: AccountUser; passwordChanged?: boolean }>;
}

export async function fetchPreferences() {
  const res = await fetch("/api/backend/account/preferences");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ preferences: UserPreferences }>;
}

export async function updatePreferences(payload: Partial<UserPreferences>) {
  const res = await fetch("/api/backend/account/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ preferences: UserPreferences }>;
}

export async function deleteAccount() {
  const res = await fetch("/api/backend/account", { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchCustomerOrders() {
  const res = await fetch("/api/backend/orders");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ orders: CustomerOrder[] }>;
}

export async function fetchCustomerOrder(id: string) {
  const res = await fetch(`/api/backend/orders/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function reorderOrder(id: string) {
  const res = await fetch(`/api/backend/orders/${id}/reorder`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchAddresses() {
  const res = await fetch("/api/backend/addresses");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ addresses: Address[] }>;
}

export async function createAddress(payload: Partial<Address>) {
  const res = await fetch("/api/backend/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ address: Address }>;
}

export async function updateAddress(id: string, payload: Partial<Address>) {
  const res = await fetch(`/api/backend/addresses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ address: Address }>;
}

export async function deleteAddress(id: string) {
  const res = await fetch(`/api/backend/addresses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function setDefaultAddress(id: string) {
  const res = await fetch(`/api/backend/addresses/${id}/default`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ address: Address }>;
}

export async function fetchFavoriteRestaurants() {
  const res = await fetch("/api/backend/account/favorites/restaurants");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ restaurants: RestaurantCard[] }>;
}

export async function fetchFavoritesSummary() {
  const res = await fetch("/api/backend/account/favorites/summary");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    restaurantIds: string[];
    productIds: string[];
  }>;
}

export async function addFavoriteRestaurant(restaurantId: string) {
  const res = await fetch(
    `/api/backend/account/favorites/restaurants/${restaurantId}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function removeFavoriteRestaurant(restaurantId: string) {
  const res = await fetch(
    `/api/backend/account/favorites/restaurants/${restaurantId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchFavoriteProducts() {
  const res = await fetch("/api/backend/account/favorites/products");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ products: FavoriteProduct[] }>;
}

export async function addFavoriteProduct(productId: string) {
  const res = await fetch(
    `/api/backend/account/favorites/products/${productId}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function removeFavoriteProduct(productId: string) {
  const res = await fetch(
    `/api/backend/account/favorites/products/${productId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch("/api/backend/account/notifications");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ notifications: NotificationItem[] }>;
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/backend/account/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch("/api/backend/account/notifications/read-all", {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
