import PanelShell from "@/components/panels/PanelShell";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  user: { firstName: string; lastName: string; phone: string };
  items: unknown[];
};

export default async function RestaurantActiveOrdersPage() {
  let orders: ActiveOrder[] = [];

  try {
    const data = await serverApiFetch<{ orders: ActiveOrder[] }>(
      "/restaurant/active-orders",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell title="აქტიური შეკვეთები" backHref="/restaurant">
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
            აქტიური შეკვეთები არ არის
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
              <p className="mt-1 text-sm text-neutral-500">
                {order.user.firstName} {order.user.lastName} · {order.user.phone}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                პოზიცია: {order.items.length} · ₾{order.total.toFixed(2)}
              </p>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
