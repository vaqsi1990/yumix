import { serverApiFetch } from "@/lib/session";
import type { PublicRestaurant } from "@/lib/restaurants";

export type PublicOffer = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  discountPrice: number;
  outOfStock: boolean;
  restaurant: {
    slug: string;
    name: string;
    logo: string;
  };
};

export type OfferRestaurant = PublicRestaurant & {
  offersCount: number;
  maxDiscountPercent: number;
};

export async function getPublicOffers(): Promise<{
  offers: PublicOffer[];
  restaurants: OfferRestaurant[];
  fromDatabase: boolean;
}> {
  try {
    return await serverApiFetch<{
      offers: PublicOffer[];
      restaurants: OfferRestaurant[];
      fromDatabase: boolean;
    }>("/shop/offers");
  } catch {
    return { offers: [], restaurants: [], fromDatabase: false };
  }
}
