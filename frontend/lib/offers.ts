import { serverApiFetch } from "@/lib/session";

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

export async function getPublicOffers(): Promise<{
  offers: PublicOffer[];
  fromDatabase: boolean;
}> {
  try {
    return await serverApiFetch<{
      offers: PublicOffer[];
      fromDatabase: boolean;
    }>("/shop/offers");
  } catch {
    return { offers: [], fromDatabase: false };
  }
}
