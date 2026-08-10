import type { AddonCategory } from "@/lib/addon-categories";

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
  addOns?: { addonId: string; quantity: number }[];
};

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
    message?: string;
    error?: string;
  };
  return data.message ?? data.error ?? "მოთხოვნა ვერ შესრულდა";
}

export async function addToCart(payload: AddCartItemPayload) {
  const res = await fetch("/api/backend/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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

export async function fetchCartSummary() {
  const res = await fetch("/api/backend/cart");
  if (!res.ok) return { itemCount: 0 };
  const data = (await res.json()) as {
    totals: { itemCount: number } | null;
  };
  return { itemCount: data.totals?.itemCount ?? 0 };
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
  latitude?: number | null;
  longitude?: number | null;
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
