import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

type RestaurantProfile = {
  name: string;
  description: string | null;
  city: string;
  address: string;
  phone: string;
  deliveryFee: number | null;
  minimumOrder: number | null;
  isOpen: boolean;
};

export default async function RestaurantProfilePage() {
  let restaurant: RestaurantProfile | null = null;

  try {
    const data = await serverApiFetch<{ restaurant: RestaurantProfile }>(
      "/restaurant/profile",
    );
    restaurant = data.restaurant;
  } catch {
    restaurant = null;
  }

  return (
    <PanelShell title="რესტორნის პროფილი" backHref="/restaurant">
      {!restaurant ? (
        <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
          რესტორანი ჯერ არ არის მიბმული ანგარიშზე
        </p>
      ) : (
        <div className="rounded-2xl bg-[#F3F4F6] px-4 py-5 sm:px-6">
          <h3 className="text-xl font-bold text-neutral-900">
            {restaurant.name}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {restaurant.description}
          </p>
          <div className="mt-4 space-y-1 text-sm text-neutral-700">
            <p>
              მისამართი: {restaurant.city}, {restaurant.address}
            </p>
            <p>ტელეფონი: {restaurant.phone}</p>
            <p>
              მიწოდების საფასური: ₾{(restaurant.deliveryFee ?? 0).toFixed(2)}
            </p>
            <p>
              მინ. შეკვეთა: ₾{(restaurant.minimumOrder ?? 0).toFixed(2)}
            </p>
            <p>
              სტატუსი:{" "}
              {restaurant.isOpen ? "\u10e6\u10d8\u10d0\u10d0" : "\u10d3\u10d0\u10ee\u10e3\u10e0\u10e3\u10da\u10d8\u10d0"}
            </p>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
