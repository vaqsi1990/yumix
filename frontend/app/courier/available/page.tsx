import PanelShell from "@/components/panels/PanelShell";
import {
  CourierAcceptButton,
} from "@/components/courier/CourierOrderActions";
import { serverApiFetch } from "@/lib/session";

type AvailableOrder = {
  id: string;
  orderNumber: string;
  total: number;
  restaurant: { name: string; address: string; city: string };
  address: { city: string; street: string };
};

export default async function CourierAvailablePage() {
  let orders: AvailableOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: AvailableOrder[] }>(
      "/courier/available",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell title="ხელმისაწვდომი შეკვეთები" backHref="/courier">
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
            ხელმისაწვდომი შეკვეთები არ არის
          </p>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl bg-[#F3F4F6] px-4 py-5"
            >
              <h3 className="font-bold text-neutral-900">#{order.orderNumber}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                რესტორანი: {order.restaurant.name}
              </p>
              <p className="text-sm text-neutral-500">
                {order.restaurant.city}, {order.restaurant.address}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                მიტანა: {order.address.city}, {order.address.street}
              </p>
              <p className="mt-2 font-semibold text-[#FF0050]">
                ₾{order.total.toFixed(2)}
              </p>
              <div className="mt-3">
                <CourierAcceptButton orderId={order.id} />
              </div>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
