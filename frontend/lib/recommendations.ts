import { getAccessToken, serverApiFetch } from "@/lib/session";
import {
  enrichRestaurantsWithDeliveryContext,
  type PublicMenuProduct,
  type PublicRestaurant,
} from "@/lib/restaurants";

export type RecommendedProduct = PublicMenuProduct & {
  restaurant: {
    id: string;
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
    const data = await serverApiFetch<RecommendedForYouData>("/shop/recommended", {
      token,
    });
    const restaurants = await enrichRestaurantsWithDeliveryContext(
      data.restaurants,
    );
    return { ...data, restaurants };
  } catch {
    return { restaurants: [], products: [], topCategories: [] };
  }
}
