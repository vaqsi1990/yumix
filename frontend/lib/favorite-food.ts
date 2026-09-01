import { serverApiFetch } from "@/lib/session";
import { getPublicRestaurants, type PublicMenuProduct } from "@/lib/restaurants";

export type FavoriteFoodProduct = PublicMenuProduct & {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    logo: string;
    isOpen: boolean;
    rating: number;
    reviews: number;
    time: string;
    deliveryFeeLabel: string;
  };
};

type FavoriteFoodApiProduct = Omit<FavoriteFoodProduct, "restaurant"> & {
  restaurant: {
    id?: string;
    slug: string;
    name: string;
    logo: string;
    isOpen: boolean;
    rating?: number;
    reviews?: number;
    time?: string;
    deliveryFeeLabel?: string;
  };
};

function enrichFavoriteFoodProducts(
  products: FavoriteFoodApiProduct[],
): FavoriteFoodProduct[] {
  return products.map((product) => {
    const restaurant = product.restaurant;
    return {
      ...product,
      restaurant: {
        ...restaurant,
        id: restaurant.id ?? "",
        rating: restaurant.rating ?? 0,
        reviews: restaurant.reviews ?? 0,
        time:
          restaurant.time ??
          (restaurant.isOpen ? "25-45 წთ" : "დახურულია"),
        deliveryFeeLabel: restaurant.deliveryFeeLabel ?? "—",
      },
    };
  });
}

export async function getPublicFavoriteFoods(): Promise<{
  products: FavoriteFoodProduct[];
}> {
  try {
    const [data, { restaurants }] = await Promise.all([
      serverApiFetch<{
        products?: FavoriteFoodApiProduct[];
        items?: unknown[];
      }>("/shop/favorite-foods"),
      getPublicRestaurants(),
    ]);

    const products = Array.isArray(data.products) ? data.products : [];
    const restaurantBySlug = new Map(
      restaurants.map((restaurant) => [restaurant.slug, restaurant]),
    );

    return {
      products: enrichFavoriteFoodProducts(products).map((product) => {
        const meta = restaurantBySlug.get(product.restaurant.slug);
        if (!meta) return product;

        return {
          ...product,
          restaurant: {
            ...product.restaurant,
            id: meta.id,
            rating: meta.rating,
            reviews: meta.reviews,
            time: meta.time,
            deliveryFeeLabel: meta.deliveryFeeLabel,
          },
        };
      }),
    };
  } catch {
    return { products: [] };
  }
}
