"use client";

import { useEffect, useRef, useState } from "react";
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
  onOrderUpdate,
}: {
  orderId: string;
  initialOrder?: TrackingOrder;
  poll?: boolean;
  showWaitingHint?: boolean;
  title?: string;
  onOrderUpdate?: (order: TrackingOrder) => void;
}) {
  const [order, setOrder] = useState<TrackingOrder | null>(initialOrder ?? null);
  const [mounted, setMounted] = useState(false);
  const [liveStale, setLiveStale] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const onOrderUpdateRef = useRef(onOrderUpdate);

  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialOrder) setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!poll || !orderId) return;

    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let retryDelay = 1000;

    async function refresh() {
      try {
        const res = await fetch(`/api/backend/orders/${orderId}`);
        if (!res.ok) {
          setRefreshError(true);
          return;
        }
        const data = (await res.json()) as { order: TrackingOrder };
        if (cancelled) return;
        setOrder(data.order);
        setRefreshError(false);
        onOrderUpdateRef.current?.(data.order);
      } catch {
        if (!cancelled) setRefreshError(true);
      }
    }

    function scheduleReconnect() {
      if (cancelled) return;
      setLiveStale(true);
      reconnectTimer = setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 30_000);
        connect();
      }, retryDelay);
    }

    function connect() {
      if (cancelled) return;
      source?.close();
      source = new EventSource(`/api/backend/orders/${orderId}/events`);
      source.onmessage = () => {
        retryDelay = 1000;
        setLiveStale(false);
        void refresh();
      };
      source.onerror = () => {
        source?.close();
        source = null;
        scheduleReconnect();
      };
    }

    void refresh();
    connect();

    fallbackTimer = setInterval(() => void refresh(), 15_000);

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {liveStale || refreshError ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            {refreshError ? "განახლება ვერ მოხერხდა" : "ცოცხალი კავშირი შეწყვეტილია"}
          </span>
        ) : null}
      </div>
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

      {refreshError ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#FF0050] hover:underline"
          onClick={() => void fetch(`/api/backend/orders/${orderId}`).then((res) => {
            if (!res.ok) return;
            return res.json().then((data: { order: TrackingOrder }) => {
              setOrder(data.order);
              setRefreshError(false);
            });
          })}
        >
          თავიდან ცდა
        </button>
      ) : null}
    </section>
  );
}
