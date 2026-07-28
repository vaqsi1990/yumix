import PanelShell from "@/components/panels/PanelShell";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  restaurant: { name: string };
};

export default async function AdminOrdersPage() {
  let orders: AdminOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: AdminOrder[] }>("/admin/orders");
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell
      title={"\u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8"}
      subtitle={`\u10e1\u10e3\u10da: ${orders.length}`}
      backHref="/admin"
    >
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F3F4F6] text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">{"\u10dc\u10dd\u10db\u10d4\u10e0\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10db\u10dd\u10db\u10ee\u10db\u10d0\u10e0\u10d4\u10d1\u10d4\u10da\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10e0\u10d4\u10e1\u10e2\u10dd\u10e0\u10d0\u10dc\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10e1\u10e2\u10d0\u10e2\u10e3\u10e1\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10d7\u10d0\u10dc\u10ee\u10d0"}</th>
              <th className="px-4 py-3 font-medium">{"\u10d7\u10d0\u10e0\u10d8\u10e6\u10d8"}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  {"\u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8 \u10ef\u10d4\u10e0 \u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1"}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div>
                      {order.user.firstName} {order.user.lastName}
                    </div>
                    <div className="text-xs text-neutral-500">{order.user.phone}</div>
                  </td>
                  <td className="px-4 py-3">{order.restaurant.name}</td>
                  <td className="px-4 py-3">{ORDER_STATUS_KA[order.status]}</td>
                  <td className="px-4 py-3">{formatGel(order.total)}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
