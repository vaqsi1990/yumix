import AccountFavoritesClient from "@/components/account/AccountFavoritesClient";
import { serverApiFetch } from "@/lib/session";
import type { FavoriteProduct, RestaurantCard } from "@/lib/account-api";
import type { PublicAddOn } from "@/lib/shop-api";

export const dynamic = "force-dynamic";

export default async function AccountFavoritesPage() {
  let restaurants: RestaurantCard[] = [];
  let products: FavoriteProduct[] = [];
  const restaurantAddOns: Record<string, PublicAddOn[]> = {};

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

    const slugs = [...new Set(products.map((p) => p.restaurant.slug))];
    await Promise.all(
      slugs.map(async (slug) => {
        try {
          const menu = await serverApiFetch<{
            addOns?: PublicAddOn[];
            restaurant: { id: string };
          }>(`/shop/restaurants/${slug}`);
          if (menu.restaurant?.id) {
            restaurantAddOns[menu.restaurant.id] = menu.addOns ?? [];
          }
        } catch {
          // ignore
        }
      }),
    );
  } catch {
    restaurants = [];
    products = [];
  }

  return (
    <AccountFavoritesClient
      restaurants={restaurants}
      products={products}
      restaurantAddOns={restaurantAddOns}
    />
  );
}
