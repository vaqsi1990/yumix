import { onlyStandardMenuCategories } from "@/lib/menu-category-order";

export function getRestaurantName(
  id: string,
  restaurants: { id: string; name: string }[],
) {
  return restaurants.find((r) => r.id === id)?.name ?? "—";
}

export function getCategoryName(
  id: string,
  categories: { id: string; name: string }[],
) {
  return categories.find((c) => c.id === id)?.name ?? "—";
}

export function getCategoriesForRestaurant<
  T extends { restaurantId: string; name: string; sortOrder?: number },
>(restaurantId: string, categories: T[]): T[] {
  const scoped = restaurantId
    ? categories.filter((c) => c.restaurantId === restaurantId)
    : categories;
  return onlyStandardMenuCategories(scoped);
}
