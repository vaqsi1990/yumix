"use client";

import dynamic from "next/dynamic";

const OrderTrackingMapInner = dynamic(() => import("./OrderTrackingMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
  ),
});

export default function OrderTrackingMap({
  points,
  className,
}: {
  points: Array<{ latitude: number; longitude: number; label?: string }>;
  className?: string;
}) {
  return <OrderTrackingMapInner points={points} className={className} />;
}
