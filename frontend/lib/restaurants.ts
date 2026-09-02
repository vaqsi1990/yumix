import { getAccessToken, serverApiFetch } from "@/lib/session";

import type { DeliveryEta } from "@/lib/delivery";

export type PublicRestaurant = {
  id: string;
  slug: string;
  name: string;
  categories: string;
  rating: number;
  reviews: number;
  time: string;
  deliveryFeeLabel: string;
  image: string;
  logo: string;
  city: string;
  isOpen: boolean;
  distanceKm?: number;
  distanceLabel?: string;
  deliverable?: boolean;
  outOfRange?: boolean;
  deliveryFee?: number;
  minimumOrder?: number | null;
  etaLabel?: string;
  eta?: DeliveryEta;
};

export type PublicRestaurantDetail = PublicRestaurant & {
  description?: string | null;
  minimumOrderLabel?: string;
};

export type PublicMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  discountPrice: number | null;
  outOfStock: boolean;
  variants: { id: string; name: string; price: number }[];
  customizationGroups?: {
    id: string;
    name: string;
    description?: string | null;
    kind?: "option" | "exclusion";
    required: boolean;
    minSelections: number;
    maxSelections: number;
    sortOrder: number;
    options: { id: string; name: string; price: number }[];
  }[];
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  products: PublicMenuProduct[];
};

export type RestaurantMenuResponse = {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  addOns?: { id: string; name: string; price: number; category?: "FOOD" | "DRINK" }[];
  fromDatabase: boolean;
};

export const DEMO_RESTAURANTS: PublicRestaurant[] = [
  {
    id: "demo-pizza-room",
    slug: "pizza-room",
    name: "Pizza Room",
    categories: "პიცა, იტალიური",
    rating: 4.8,
    reviews: 326,
    time: "30-40 წთ",
    deliveryFeeLabel: "₾6.00",
    image: "/rest/1.jpg",
    logo: "/rest/1.jpg",
    city: "თბილისი",
    isOpen: true,
  },
  {
    id: "demo-burger-hub",
    slug: "burger-hub",
    name: "Burger Hub",
    categories: "ბურგერი, ამერიკული",
    rating: 4.7,
    reviews: 412,
    time: "25-35 წთ",
    deliveryFeeLabel: "₾5.50",
    image: "/rest/3.jpg",
    logo: "/rest/3.jpg",
    city: "თბილისი",
    isOpen: true,
  },
  {
    id: "demo-sushi-spot",
    slug: "sushi-spot",
    name: "Sushi Spot",
    categories: "სუში, აზიური",
    rating: 4.9,
    reviews: 198,
    time: "35-45 წთ",
    deliveryFeeLabel: "₾7.00",
    image: "/rest/4.jpg",
    logo: "/rest/4.jpg",
    city: "თბილისი",
    isOpen: true,
  },
  {
    id: "demo-georgian-house",
    slug: "georgian-house",
    name: "Georgian House",
    categories: "ქართული, ტრადიციული",
    rating: 4.6,
    reviews: 541,
    time: "40-50 წთ",
    deliveryFeeLabel: "₾4.50",
    image: "/rest/5.jpg",
    logo: "/rest/5.jpg",
    city: "თბილისი",
    isOpen: true,
  },
];

function filterDemo(query?: string) {
  const q = query?.trim();
  if (!q) return DEMO_RESTAURANTS;
  return DEMO_RESTAURANTS.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.categories.toLowerCase().includes(q.toLowerCase()) ||
      r.city.toLowerCase().includes(q.toLowerCase()),
  );
}

export async function getPublicRestaurants(query?: string): Promise<{
  restaurants: PublicRestaurant[];
  fromDatabase: boolean;
  pendingCount?: number;
}> {
  const data = await getPublicRestaurantsRaw(query);
  const restaurants = await enrichRestaurantsWithDeliveryContext(data.restaurants);
  return { ...data, restaurants };
}

async function getPublicRestaurantsRaw(query?: string): Promise<{
  restaurants: PublicRestaurant[];
  fromDatabase: boolean;
  pendingCount?: number;
}> {
  const q = query?.trim();
  const path = q
    ? `/shop/restaurants?q=${encodeURIComponent(q)}`
    : "/shop/restaurants";

  try {
    return await serverApiFetch<{
      restaurants: PublicRestaurant[];
      fromDatabase: boolean;
      pendingCount?: number;
    }>(path);
  } catch {
    return { restaurants: filterDemo(q), fromDatabase: false, pendingCount: 0 };
  }
}

export type RestaurantDeliveryQuote = {
  restaurantId: string;
  slug: string;
  deliverable: boolean;
  outOfRange: boolean;
  deliveryFee?: number;
  distanceKm?: number | null;
  minimumOrder?: number | null;
  eta?: DeliveryEta | null;
  reason?: string;
};

export async function fetchDeliveryContextMap(addressId?: string) {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const params = addressId
      ? `?addressId=${encodeURIComponent(addressId)}`
      : "";
    const data = await serverApiFetch<{
      hasLocation: boolean;
      restaurants: PublicRestaurant[];
    }>(`/shop/restaurants/delivery-context${params}`, { token });
    return new Map(data.restaurants.map((restaurant) => [restaurant.id, restaurant]));
  } catch {
    return null;
  }
}

export function mergeRestaurantDeliveryFields(
  restaurant: PublicRestaurant,
  enriched?: PublicRestaurant,
): PublicRestaurant {
  if (!enriched) return restaurant;
  return {
    ...restaurant,
    deliverable: enriched.deliverable,
    outOfRange: enriched.outOfRange,
    distanceKm: enriched.distanceKm ?? restaurant.distanceKm,
    distanceLabel: enriched.distanceLabel ?? restaurant.distanceLabel,
    deliveryFee: enriched.deliveryFee ?? restaurant.deliveryFee,
    minimumOrder: enriched.minimumOrder ?? restaurant.minimumOrder,
    etaLabel: enriched.etaLabel ?? restaurant.etaLabel,
    eta: enriched.eta ?? restaurant.eta,
    time: enriched.eta?.totalLabel ?? enriched.time ?? restaurant.time,
    deliveryFeeLabel: enriched.deliveryFeeLabel ?? restaurant.deliveryFeeLabel,
  };
}

export async function enrichRestaurantsWithDeliveryContext<T extends PublicRestaurant>(
  restaurants: T[],
  addressId?: string,
): Promise<T[]> {
  const map = await fetchDeliveryContextMap(addressId);
  if (!map) return restaurants;

  const bySlug = new Map(
    [...map.values()].map((restaurant) => [restaurant.slug, restaurant]),
  );

  return restaurants.map((restaurant) => {
    const enriched =
      map.get(restaurant.id) ?? bySlug.get(restaurant.slug);
    return mergeRestaurantDeliveryFields(restaurant, enriched) as T;
  });
}

export function applyDeliveryQuoteToRestaurant<
  T extends PublicRestaurantDetail,
>(restaurant: T, quote: RestaurantDeliveryQuote | null): T {
  if (!quote) return restaurant;

  return {
    ...restaurant,
    deliverable: quote.deliverable,
    outOfRange: quote.outOfRange,
    deliveryFee: quote.deliveryFee ?? restaurant.deliveryFee,
    distanceKm: quote.distanceKm ?? restaurant.distanceKm,
    minimumOrder: quote.minimumOrder ?? restaurant.minimumOrder,
    minimumOrderLabel:
      quote.minimumOrder != null
        ? `₾${quote.minimumOrder.toFixed(2)}`
        : restaurant.minimumOrderLabel,
    deliveryFeeLabel:
      quote.deliveryFee != null
        ? `₾${quote.deliveryFee.toFixed(2)}`
        : restaurant.deliveryFeeLabel,
    eta: quote.eta ?? restaurant.eta,
    etaLabel: quote.eta?.label ?? restaurant.etaLabel,
    time: quote.eta?.totalLabel ?? restaurant.time,
  };
}

export async function getRestaurantDeliveryQuote(
  slug: string,
  addressId?: string,
): Promise<RestaurantDeliveryQuote | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const params = addressId
      ? `?addressId=${encodeURIComponent(addressId)}`
      : "";
    return await serverApiFetch<RestaurantDeliveryQuote>(
      `/shop/restaurants/${encodeURIComponent(slug)}/delivery-quote${params}`,
      { token },
    );
  } catch {
    return null;
  }
}

export async function getPublicRestaurantsByMenuFood(
  keywords: string[],
): Promise<{
  restaurants: PublicRestaurant[];
  fromDatabase: boolean;
  pendingCount?: number;
}> {
  const normalized = [
    ...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)),
  ];

  if (normalized.length === 0) {
    return { restaurants: [], fromDatabase: true, pendingCount: 0 };
  }

  const path = `/shop/restaurants?menu=${encodeURIComponent(normalized.join(","))}`;

  try {
    const data = await serverApiFetch<{
      restaurants: PublicRestaurant[];
      fromDatabase: boolean;
      pendingCount?: number;
    }>(path);
    const restaurants = await enrichRestaurantsWithDeliveryContext(
      data.restaurants,
    );
    return { ...data, restaurants };
  } catch {
    const filtered = DEMO_RESTAURANTS.filter((restaurant) => {
      const haystack = `${restaurant.name} ${restaurant.categories}`.toLowerCase();
      return normalized.some((keyword) =>
        haystack.includes(keyword.toLowerCase()),
      );
    });
    return { restaurants: filtered, fromDatabase: false, pendingCount: 0 };
  }
}

export async function getRestaurantMenu(
  slug: string,
): Promise<RestaurantMenuResponse | null> {
  try {
    return await serverApiFetch<RestaurantMenuResponse>(
      `/shop/restaurants/${encodeURIComponent(slug)}`,
    );
  } catch {
    const demo = DEMO_RESTAURANTS.find((r) => r.slug === slug);
    if (!demo) return null;
    return { restaurant: demo, menu: [], fromDatabase: false };
  }
}
