import PanelShell from "@/components/panels/PanelShell";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

type RestaurantOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  user: { firstName: string; lastName: string };
};

export default async function RestaurantOrdersPage() {
  let orders: RestaurantOrder[] = [];

  try {
    const data = await serverApiFetch<{ orders: RestaurantOrder[] }>(
      "/restaurant/orders",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell title="რესტორნის შეკვეთები" backHref="/restaurant">
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F3F4F6] text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">ნომერი</th>
              <th className="px-4 py-3 font-medium">მომხმარებელი</th>
              <th className="px-4 py-3 font-medium">სტატუსი</th>
              <th className="px-4 py-3 font-medium">თანხა</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  შეკვეთები ჯერ არ არის
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    {order.user.firstName} {order.user.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {ORDER_STATUS_KA[order.status] ?? order.status}
                  </td>
                  <td className="px-4 py-3">₾{order.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
