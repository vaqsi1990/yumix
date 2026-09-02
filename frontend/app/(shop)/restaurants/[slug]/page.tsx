import { notFound } from "next/navigation";
import RestaurantMenuClient from "@/components/shop/RestaurantMenuClient";
import {
  applyDeliveryQuoteToRestaurant,
  getRestaurantDeliveryQuote,
  getRestaurantMenu,
} from "@/lib/restaurants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RestaurantMenuPage({ params }: Props) {
  const { slug } = await params;
  const [data, deliveryQuote] = await Promise.all([
    getRestaurantMenu(slug),
    getRestaurantDeliveryQuote(slug),
  ]);

  if (!data) {
    notFound();
  }

  const restaurant = applyDeliveryQuoteToRestaurant(
    data.restaurant,
    deliveryQuote,
  );

  return (
    <RestaurantMenuClient
      restaurant={restaurant}
      menu={data.menu}
      addOns={data.addOns ?? []}
      deliveryUnavailableReason={
        deliveryQuote?.deliverable === false ? deliveryQuote.reason : undefined
      }
    />
  );
}
