"use client";

import { useEffect, useState } from "react";
import CourierPageHeader from "@/components/courier/CourierPageHeader";
import {
  CourierStatusButtons,
} from "@/components/courier/CourierOrderActions";
import CourierLocationTracker from "@/components/courier/CourierLocationTracker";
import { formatGel } from "@/lib/admin/format";

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  customerNote: string | null;
  eta?: { totalLabel: string; label: string } | null;
  restaurant: { name: string; address: string; city: string; phone: string };
  address: {
    city: string;
    street: string;
    building: string | null;
    apartment: string | null;
    deliveryNote: string | null;
  };
  customer?: { name: string; phone: string } | null;
  items?: Array<{ quantity: number; name: string; variantName: string | null }>;
};

export default function CourierActiveClient() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/backend/courier/active");
      if (!res.ok) return;
      const data = (await res.json()) as { orders: ActiveOrder[] };
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <CourierPageHeader title="აქტიური მიწოდება" />
      <CourierLocationTracker enabled={orders.length > 0} />
      {loading ? (
        <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
          იტვირთება...
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
          აქტიური მიწოდება არ გაქვს
        </p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-5"
            >
              <h3 className="font-bold text-neutral-900">#{order.orderNumber}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                რესტორანი: {order.restaurant.name}
              </p>
              <p className="text-sm text-neutral-500">
                {order.restaurant.city}, {order.restaurant.address} ·{" "}
                {order.restaurant.phone}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                მიტანა: {order.address.city}, {order.address.street}
                {order.address.building ? `, ${order.address.building}` : ""}
                {order.address.apartment ? `, ბ. ${order.address.apartment}` : ""}
              </p>
              {order.address.deliveryNote ? (
                <p className="mt-1 text-xs text-neutral-500">
                  {order.address.deliveryNote}
                </p>
              ) : null}
              {order.customer ? (
                <p className="mt-2 text-sm">
                  მომხმარებელი: {order.customer.name} · {order.customer.phone}
                </p>
              ) : null}
              {order.items && order.items.length > 0 ? (
                <ul className="mt-2 text-sm text-neutral-600">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      {item.quantity}× {item.name}
                      {item.variantName ? ` (${item.variantName})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 font-semibold text-[#FF0050]">
                {formatGel(order.total)} · {order.paymentMethod}
              </p>
              {order.eta ? (
                <p className="mt-1 text-sm text-neutral-500">{order.eta.label}</p>
              ) : null}
              <CourierStatusButtons orderId={order.id} status={order.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
