"use client";

import { useEffect, useState } from "react";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { formatGel } from "@/lib/admin/format";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedTime: number | null;
  customerNote: string | null;
  createdAt: string;
  restaurant: { name: string; slug: string; phone: string };
  address: {
    city: string;
    street: string;
    building: string | null;
    apartment: string | null;
    deliveryNote: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: { name: string };
    variant: { name: string } | null;
    addOns: Array<{ addon: { name: string }; quantity: number; price: number }>;
    customizations?: Array<{
      groupName: string;
      optionName: string;
      quantity: number;
      price: number;
    }>;
  }>;
};

export default function OrderDetailClient({
  initialOrder,
}: {
  initialOrder: OrderDetail;
}) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (order.status === "DELIVERED" || order.status === "CANCELLED") return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/backend/orders/${order.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { order: OrderDetail };
        setOrder(data.order);
      } catch {
        // ignore polling errors
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [order.id, order.status]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">სტატუსი</h2>
          <div className="mt-4">
            <OrderTimeline status={order.status} />
          </div>
          {order.estimatedTime && order.status !== "DELIVERED" && (
            <p className="mt-4 text-sm text-neutral-500">
              სავარაუდო დრო: ~{order.estimatedTime} წთ
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">პროდუქტები</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {item.quantity}× {item.product.name}
                  </p>
                  {item.variant && (
                    <p className="text-neutral-500">{item.variant.name}</p>
                  )}
                  {item.addOns.length > 0 && (
                    <p className="text-neutral-400">
                      {item.addOns.map((a) => a.addon.name).join(", ")}
                    </p>
                  )}
                  {(item.customizations?.length ?? 0) > 0 && (
                    <p className="text-neutral-400">
                      {(item.customizations ?? [])
                        .map((c) => `${c.groupName}: ${c.optionName}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <p className="font-semibold">{formatGel(item.total)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <div>
          <p className="text-sm text-neutral-500">რესტორანი</p>
          <p className="font-bold">{order.restaurant.name}</p>
          <p className="text-sm text-neutral-500">{order.restaurant.phone}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-500">მისამართი</p>
          <p className="text-sm">
            {order.address.city}, {order.address.street}
            {order.address.building ? `, ${order.address.building}` : ""}
            {order.address.apartment ? `, ბ. ${order.address.apartment}` : ""}
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>ქვეჯამი</dt>
            <dd>{formatGel(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>მიწოდება</dt>
            <dd>{formatGel(order.deliveryFee)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>ფასდაკლება</dt>
              <dd>−{formatGel(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
            <dt>სულ</dt>
            <dd>{formatGel(order.total)}</dd>
          </div>
        </dl>
        <p className="text-xs text-neutral-500">
          გადახდა: {order.paymentMethod} · {order.paymentStatus}
        </p>
      </aside>
    </div>
  );
}
