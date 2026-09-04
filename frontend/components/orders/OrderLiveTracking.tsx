"use client";

import { useEffect, useState } from "react";
import OrderTrackingMap from "@/components/orders/OrderTrackingMap";

const TRACKABLE_STATUSES = new Set(["PICKED_UP", "ON_THE_WAY"]);

type TrackingOrder = {
  id: string;
  status: string;
  orderNumber?: string;
  address: {
    latitude?: number | null;
    longitude?: number | null;
  };
  restaurant?: {
    latitude?: number | null;
    longitude?: number | null;
  };
  courier?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: {
      latitude: number | null;
      longitude: number | null;
      updatedAt: string | null;
    } | null;
  } | null;
};

function buildMapPoints(order: TrackingOrder) {
  return [
    order.address.latitude != null && order.address.longitude != null
      ? {
          latitude: order.address.latitude,
          longitude: order.address.longitude,
          label: "customer",
        }
      : null,
    order.restaurant?.latitude != null && order.restaurant?.longitude != null
      ? {
          latitude: order.restaurant.latitude,
          longitude: order.restaurant.longitude,
          label: "restaurant",
        }
      : null,
    order.courier?.location?.latitude != null &&
    order.courier?.location?.longitude != null
      ? {
          latitude: order.courier.location.latitude,
          longitude: order.courier.location.longitude,
          label: "courier",
        }
      : null,
  ].filter((point): point is NonNullable<typeof point> => point != null);
}

export default function OrderLiveTracking({
  orderId,
  initialOrder,
  poll = true,
  showWaitingHint = false,
  title = "მიწოდების თვალყური",
}: {
  orderId: string;
  initialOrder?: TrackingOrder;
  poll?: boolean;
  showWaitingHint?: boolean;
  title?: string;
}) {
  const [order, setOrder] = useState<TrackingOrder | null>(initialOrder ?? null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialOrder) setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!poll || !orderId) return;

    async function refresh() {
      try {
        const res = await fetch(`/api/backend/orders/${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { order: TrackingOrder };
        setOrder(data.order);
      } catch {
        // ignore polling errors
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 12_000);
    return () => window.clearInterval(timer);
  }, [orderId, poll]);

  if (!order) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-4 text-sm text-neutral-500">იტვირთება...</p>
      </section>
    );
  }

  const isTrackable = TRACKABLE_STATUSES.has(order.status);
  const mapPoints = buildMapPoints(order);
  const hasCourierLocation =
    order.courier?.location?.latitude != null &&
    order.courier?.location?.longitude != null;

  if (!isTrackable) {
    if (!showWaitingHint) return null;
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900">{title}</p>
        <p className="mt-1">
          რუკა გამოჩნდება, როცა კურიერი აიღებს შეკვეთას და გზაში გავა.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {order.courier ? (
        <p className="mt-1 text-sm text-neutral-500">
          {order.courier.firstName} {order.courier.lastName}
          {order.courier.phone ? ` · ${order.courier.phone}` : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-neutral-500">კურიერი მიმდინარეობს</p>
      )}

      <div className="mt-4">
        {mapPoints.length > 0 ? (
          mounted ? (
            <OrderTrackingMap points={mapPoints} />
          ) : (
            <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
          )
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
            რუკისთვის საჭიროა მისამართის კოორდინატები ან კურიერის მდებარეობა.
          </div>
        )}
      </div>

      {mapPoints.length > 0 && !hasCourierLocation ? (
        <p className="mt-3 text-sm text-neutral-500">
          კურიერის მდებარეობა ჯერ არ არის — როცა GPS გაიგზავნება, აქ გამოჩნდება.
        </p>
      ) : null}
    </section>
  );
}
