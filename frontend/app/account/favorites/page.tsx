import AccountFavoritesClient from "@/components/account/AccountFavoritesClient";
import { serverApiFetch } from "@/lib/session";
import type { FavoriteProduct, RestaurantCard } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export default async function AccountFavoritesPage() {
  let restaurants: RestaurantCard[] = [];
  let products: FavoriteProduct[] = [];

  try {
    const [restaurantsRes, productsRes] = await Promise.all([
      serverApiFetch<{ restaurants: RestaurantCard[] }>(
        "/account/favorites/restaurants",
      ),
      serverApiFetch<{ products: FavoriteProduct[] }>(
        "/account/favorites/products",
      ),
    ]);
    restaurants = restaurantsRes.restaurants;
    products = productsRes.products;
  } catch {
    restaurants = [];
    products = [];
  }

  return (
    <AccountFavoritesClient restaurants={restaurants} products={products} />
  );
}
