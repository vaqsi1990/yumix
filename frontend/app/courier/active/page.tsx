import PanelShell from "@/components/panels/PanelShell";
import { CourierStatusButtons } from "@/components/courier/CourierOrderActions";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  restaurant: { name: string };
  address: { street: string; city: string };
  customer: { name: string; phone: string } | null;
};

export default async function CourierActivePage() {
  let orders: ActiveOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: ActiveOrder[] }>(
      "/courier/active",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell title="ჩემი აქტიური მიწოდებები" backHref="/courier">
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
            აქტიური მიწოდება არ გაქვს
          </p>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl bg-[#F3F4F6] px-4 py-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-neutral-900">
                  #{order.orderNumber}
                </h3>
                <span className="rounded-lg bg-white px-3 py-1 text-sm text-[#FF0050]">
                  {ORDER_STATUS_KA[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {order.restaurant.name} → {order.address.city},{" "}
                {order.address.street}
              </p>
              {order.customer && (
                <p className="text-sm text-neutral-500">
                  კლიენტი: {order.customer.name} · {order.customer.phone}
                </p>
              )}
              <CourierStatusButtons orderId={order.id} status={order.status} />
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
