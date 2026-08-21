import { serverApiFetch } from "@/lib/session";

export type PublicFavoriteFood = {
  id: string;
  slug: string;
  label: string;
  image: string;
};

export async function getPublicFavoriteFoods(): Promise<{
  items: PublicFavoriteFood[];
}> {
  try {
    return await serverApiFetch<{ items: PublicFavoriteFood[] }>(
      "/shop/favorite-foods",
    );
  } catch {
    return { items: [] };
  }
}
