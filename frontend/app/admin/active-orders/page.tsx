import Link from "next/link";
import PanelShell from "@/components/panels/PanelShell";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminActiveOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string };
  restaurant: { name: string };
  courier: { firstName: string; lastName: string } | null;
  address: { city: string; street: string; building: string | null };
  _count: { items: number };
};

export default async function AdminActiveOrdersPage() {
  let orders: AdminActiveOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: AdminActiveOrder[] }>(
      "/admin/active-orders",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <PanelShell
      title={"\u10d0\u10e5\u10e2\u10d8\u10e3\u10e0\u10d8 \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8"}
      subtitle={`\u10db\u10d8\u10db\u10d3\u10d8\u10dc\u10d0\u10e0\u10d4: ${orders.length}`}
      backHref="/admin"
    >
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
            {"\u10d0\u10e5\u10e2\u10d8\u10e3\u10e0\u10d8 \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8 \u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1"}
          </p>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="flex flex-col gap-2 rounded-2xl bg-[#F3F4F6] px-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <Link href={`/admin/orders/${order.id}`} className="group">
                  <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-neutral-900 group-hover:text-[#FF0050]">
                    #{order.orderNumber}
                  </h3>
                </Link>
                <p className="text-[16px] md:text-[18px] text-neutral-500">
                  {order.restaurant.name} · {order.user.firstName}{" "}
                  {order.user.lastName} · {order.user.phone}
                </p>
                <p className="mt-1 text-[16px] md:text-[18px] text-neutral-600">
                  {"\u10db\u10d8\u10e1\u10d0\u10db\u10d0\u10e0\u10d7\u10d8"}: {order.address.city},{" "}
                  {order.address.street}
                  {order.address.building ? ` ${order.address.building}` : ""}
                </p>
                <p className="mt-1 text-[16px] md:text-[18px] text-neutral-600">
                  {"\u10d9\u10e3\u10e0\u10d8\u10d4\u10e0\u10d8"}:{" "}
                  {order.courier
                    ? `${order.courier.firstName} ${order.courier.lastName}`
                    : "\u10ef\u10d4\u10e0 \u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1 \u10db\u10d8\u10dc\u10d8\u10ed\u10d4\u10d1\u10e3\u10da\u10d8"}
                </p>
                <p className="mt-1 text-[16px] md:text-[18px] text-neutral-400">
                  {formatDateTime(order.createdAt)} · {order._count.items}{" "}
                  {"\u10de\u10dd\u10d6\u10d8\u10ea\u10d8\u10d0"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="mb-2 inline-flex rounded-lg bg-white px-3 py-1.5 text-[16px] md:text-[18px] font-medium text-[#FF0050] hover:bg-white/80"
                >
                  {ORDER_STATUS_KA[order.status]}
                </Link>
                <p className="mt-2 text-[16px] md:text-[18px] font-semibold text-neutral-900">
                  {formatGel(order.total)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
