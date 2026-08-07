import { notFound } from "next/navigation";
import RestaurantMenuClient from "@/components/shop/RestaurantMenuClient";
import { getRestaurantMenu } from "@/lib/restaurants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RestaurantMenuPage({ params }: Props) {
  const { slug } = await params;
  const data = await getRestaurantMenu(slug);

  if (!data) {
    notFound();
  }

  return (
    <RestaurantMenuClient
      restaurant={data.restaurant}
      menu={data.menu}
      addOns={data.addOns ?? []}
    />
  );
}
