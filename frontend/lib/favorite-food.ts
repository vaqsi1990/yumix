import { serverApiFetch } from "@/lib/session";
import type { PublicMenuProduct } from "@/lib/restaurants";

export type FavoriteFoodProduct = PublicMenuProduct & {
  restaurant: {
    slug: string;
    name: string;
    logo: string;
    isOpen: boolean;
  };
};

export async function getPublicFavoriteFoods(): Promise<{
  products: FavoriteFoodProduct[];
}> {
  try {
    const data = await serverApiFetch<{
      products?: FavoriteFoodProduct[];
      items?: unknown[];
    }>("/shop/favorite-foods");
    return { products: Array.isArray(data.products) ? data.products : [] };
  } catch {
    return { products: [] };
  }
}
