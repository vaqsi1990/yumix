"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import CourierOnlineToggle from "@/components/courier/CourierOnlineToggle";
import CourierPageHeader from "@/components/courier/CourierPageHeader";
import { CourierAcceptButton } from "@/components/courier/CourierOrderActions";
import {
  fetchCourierAvailable,
  type CourierAvailableOrder,
} from "@/lib/courier-api";
import { courierOrderStatusLabel } from "@/lib/courier/labels";
import { formatGel } from "@/lib/admin/format";

function OrderPreview({
  order,
  action,
}: {
  order: CourierAvailableOrder;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-bold text-neutral-900">#{order.orderNumber}</h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
          {courierOrderStatusLabel(order.status)}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        რესტორანი: {order.restaurant.name}
      </p>
      <p className="text-sm text-neutral-500">
        {order.restaurant.city}, {order.restaurant.address}
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        მიტანა: {order.address.city}, {order.address.street}
        {order.address.building ? `, ${order.address.building}` : ""}
        {order.address.apartment ? `, ბ. ${order.address.apartment}` : ""}
      </p>
      <p className="mt-2 font-semibold text-[#FF0050]">{formatGel(order.total)}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </article>
  );
}

export default function CourierAvailableClient() {
  const [orders, setOrders] = useState<CourierAvailableOrder[]>([]);
  const [upcoming, setUpcoming] = useState<CourierAvailableOrder[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchCourierAvailable();
      setOrders(data.orders);
      setUpcoming(data.upcoming ?? []);
      setIsOnline(data.isOnline);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div>
      <CourierPageHeader
        title="ხელმისაწვდომი შეკვეთები"
        description="აქ ჩანს მხოლოდ «მზადაა» სტატუსის, უკურიერო შეკვეთები"
      />

      <div className="mb-4">
        <CourierOnlineToggle onStatusChange={() => void load()} />
      </div>

      {loading ? (
        <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500">
          იტვირთება...
        </p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
          {error}
        </p>
      ) : !isOnline ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-600">
          შეკვეთების სანახავად გახდი <strong>Online</strong>. Offline რეჟიმში
          სია ცარიელია.
        </p>
      ) : orders.length === 0 && upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-600">
          <p className="font-medium text-neutral-900">
            ხელმისაწვდომი შეკვეთა არ არის
          </p>
          <p className="mt-2 text-sm">
            რესტორანმა უნდა გადაიყვანოს შეკვეთა სტატუსზე «მზადაა».
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.length > 0 ? (
            <div className="grid gap-4">
              {orders.map((order) => (
                <OrderPreview
                  key={order.id}
                  order={order}
                  action={
                    <CourierAcceptButton orderId={order.id} onAccepted={load} />
                  }
                />
              ))}
            </div>
          ) : null}

          {upcoming.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                მალე მზად იქნება
              </h2>
              <div className="grid gap-4">
                {upcoming.map((order) => (
                  <OrderPreview key={order.id} order={order} />
                ))}
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                ამ შეკვეთების მიღება შესაძლებელი იქნება მხოლოდ «მზადაა»
                სტატუსზე გადაყვანის შემდეგ.
              </p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
