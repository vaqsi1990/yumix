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
    return await serverApiFetch<NearbyRestaurantsData>("/shop/nearby", {
      token,
    });
  } catch {
    return null;
  }
}
