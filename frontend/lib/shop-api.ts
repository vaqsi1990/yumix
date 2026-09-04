import type { AddonCategory } from "@/lib/addon-categories";
import type { DeliveryEta } from "@/lib/delivery";

export type PublicAddOn = {
  id: string;
  name: string;
  price: number;
  category?: AddonCategory;
};

export type AddCartItemPayload = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  restaurantId?: string;
  addOns?: { addonId: string; quantity: number }[];
  customizations?: { optionId: string; quantity: number }[];
};

export const CART_REPLACED_NOTICE =
  "წინა რესტორნის პროდუქტები წაიშალა კალათიდან";

export function cartWasReplaced(data: unknown) {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as { replacedRestaurant?: boolean }).replacedRestaurant,
  );
}

export type Address = {
  id: string;
  title: string;
  city: string;
  street: string;
  building: string | null;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  postalCode: string | null;
  deliveryNote: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
};

export type CreateOrderPayload = {
  addressId: string;
  paymentMethod: "CASH" | "CARD" | "APPLE_PAY" | "GOOGLE_PAY";
  customerNote?: string | null;
};

async function parseError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  const message = data.message ?? data.error ?? "მოთხოვნა ვერ შესრულდა";
  return Array.isArray(message) ? message.join(", ") : message;
}

function isDifferentRestaurantCartError(message: string) {
  return (
    message.includes("სხვა რესტორნის") ||
    message.includes("გაასუფთავე კალათა")
  );
}

async function postCartItem(
  payload: Omit<AddCartItemPayload, "restaurantId">,
) {
  return fetch("/api/backend/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function clearCart() {
  const res = await fetch("/api/backend/cart", { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchCartSummary(): Promise<CartSummary> {
  const res = await fetch("/api/backend/cart", { cache: "no-store" });
  if (!res.ok) {
    return {
      itemCount: 0,
      totalQuantity: 0,
      subtotal: 0,
      restaurantId: null,
      restaurantSlug: null,
      restaurantName: null,
    };
  }
  const data = (await res.json()) as Parameters<typeof parseCartSummary>[0];
  return parseCartSummary(data);
}

export async function ensureCartRestaurant(restaurantId: string) {
  const summary = await fetchCartSummary();
  if (
    summary.itemCount > 0 &&
    summary.restaurantId &&
    summary.restaurantId !== restaurantId
  ) {
    await clearCart();
    return true;
  }
  return false;
}

export async function addToCart(payload: AddCartItemPayload) {
  const { restaurantId, ...item } = payload;
  let replacedRestaurant = false;

  if (restaurantId) {
    replacedRestaurant = await ensureCartRestaurant(restaurantId);
  }

  const res = await postCartItem(item);
  if (res.ok) {
    const data = await res.json();
    return replacedRestaurant ? { ...data, replacedRestaurant: true } : data;
  }

  const message = await parseError(res);
  if (!isDifferentRestaurantCartError(message)) {
    throw new Error(message);
  }

  await clearCart();
  const retry = await postCartItem(item);
  if (!retry.ok) {
    throw new Error(await parseError(retry));
  }

  const data = await retry.json();
  return { ...data, replacedRestaurant: true };
}

export async function addExtraToCart(addonId: string, quantity = 1) {
  const res = await fetch("/api/backend/cart/extras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addonId, quantity }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchCartQuote(addressId?: string) {
  const params = addressId
    ? `?addressId=${encodeURIComponent(addressId)}`
    : "";
  const res = await fetch(`/api/backend/cart${params}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    totals: {
      subtotal: number;
      deliveryFee: number;
      discount: number;
      total: number;
      itemCount: number;
    } | null;
    delivery: {
      fee: number;
      distanceKm: number | null;
      outOfRange: boolean;
      eta?: DeliveryEta | null;
    } | null;
  }>;
}

/** Unique cart lines (not total quantity). */
export function countCartLineItems(data: {
  totals?: { itemCount?: number } | null;
  cart?: { items?: unknown[] | null } | null;
}) {
  const items = data.cart?.items ?? [];
  if (items.length > 0) return items.length;
  return data.totals?.itemCount ?? 0;
}

export type CartSummary = {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
};

export function cartTargetsDifferentRestaurant(
  summary: CartSummary,
  restaurantId: string,
) {
  return (
    summary.itemCount > 0 &&
    summary.restaurantId != null &&
    summary.restaurantId !== restaurantId
  );
}

export function confirmCartRestaurantSwitch(
  summary: CartSummary,
  nextRestaurantName?: string,
) {
  const from = summary.restaurantName ?? "სხვა რესტორანი";
  const to = nextRestaurantName ?? "ახალი რესტორანი";
  return window.confirm(
    `კალათაში გაქვს პროდუქტები „${from}“-დან. თუ გააგრძელებ, ისინი წაიშლება და დაამატებ „${to}“-დან.`,
  );
}

export function parseCartSummary(data: {
  totals?: { itemCount?: number; subtotal?: number } | null;
  cart?: {
    items?: { quantity?: number }[] | null;
    restaurant?: { id?: string; slug?: string; name?: string } | null;
    restaurantId?: string | null;
  } | null;
}): CartSummary {
  const items = data.cart?.items ?? [];
  const lineCount = countCartLineItems(data);
  const totalQuantity = items.reduce(
    (sum, item) => sum + Math.max(0, item.quantity ?? 0),
    0,
  );

  if (lineCount === 0) {
    return {
      itemCount: 0,
      totalQuantity: 0,
      subtotal: 0,
      restaurantId: null,
      restaurantSlug: null,
      restaurantName: null,
    };
  }

  return {
    itemCount: lineCount,
    totalQuantity: totalQuantity || lineCount,
    subtotal: data.totals?.subtotal ?? 0,
    restaurantId:
      data.cart?.restaurant?.id ?? data.cart?.restaurantId ?? null,
    restaurantSlug: data.cart?.restaurant?.slug ?? null,
    restaurantName: data.cart?.restaurant?.name ?? null,
  };
}

export async function fetchAddresses() {
  const res = await fetch("/api/backend/addresses");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ addresses: Address[] }>;
}

export async function createAddress(payload: {
  title: string;
  city: string;
  street: string;
  building?: string | null;
  entrance?: string | null;
  floor?: string | null;
  apartment?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  deliveryNote?: string | null;
  isDefault?: boolean;
}) {
  const res = await fetch("/api/backend/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ address: Address }>;
}

export async function createOrder(payload: CreateOrderPayload) {
  const res = await fetch("/api/backend/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function acceptCourierOrder(orderId: string) {
  const res = await fetch(`/api/backend/courier/orders/${orderId}/accept`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateCourierOrderStatus(
  orderId: string,
  status: "ON_THE_WAY" | "DELIVERED",
) {
  const res = await fetch(`/api/backend/courier/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
