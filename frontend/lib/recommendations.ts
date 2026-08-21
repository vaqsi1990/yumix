import { getAccessToken, serverApiFetch } from "@/lib/session";
import type { PublicMenuProduct, PublicRestaurant } from "@/lib/restaurants";

export type RecommendedProduct = PublicMenuProduct & {
  restaurant: {
    slug: string;
    name: string;
    logo: string;
    isOpen: boolean;
  };
};

export type RecommendedForYouData = {
  restaurants: PublicRestaurant[];
  products: RecommendedProduct[];
  topCategories: { slug: string; label: string; count: number }[];
};

export async function getRecommendedForYou(): Promise<RecommendedForYouData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    return await serverApiFetch<RecommendedForYouData>("/shop/recommended", {
      token,
    });
  } catch {
    return { restaurants: [], products: [], topCategories: [] };
  }
}
