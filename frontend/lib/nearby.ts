import { enrichRestaurantsWithDeliveryContext } from "@/lib/restaurants";
import { getAccessToken, serverApiFetch } from "@/lib/session";
import type { PublicRestaurant } from "@/lib/restaurants";

export type NearbyRestaurantsData = {
  restaurants: PublicRestaurant[];
  fromDatabase: boolean;
  hasLocation: boolean;
};

export async function getNearbyRestaurants(): Promise<NearbyRestaurantsData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const data = await serverApiFetch<NearbyRestaurantsData>("/shop/nearby", {
      token,
    });
    const restaurants = await enrichRestaurantsWithDeliveryContext(
      data.restaurants,
    );
    return { ...data, restaurants };
  } catch {
    return null;
  }
}
