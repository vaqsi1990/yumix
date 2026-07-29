import { serverApiFetch } from "@/lib/session";

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
}> {
  const q = query?.trim();
  const path = q
    ? `/shop/restaurants?q=${encodeURIComponent(q)}`
    : "/shop/restaurants";

  try {
    return await serverApiFetch<{
      restaurants: PublicRestaurant[];
      fromDatabase: boolean;
    }>(path);
  } catch {
    return { restaurants: filterDemo(q), fromDatabase: false };
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
