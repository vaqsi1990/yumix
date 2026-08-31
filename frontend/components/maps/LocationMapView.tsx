"use client";

import dynamic from "next/dynamic";

const LocationMapViewInner = dynamic(() => import("./LocationMapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
  ),
});

type LocationMapViewProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

export default function LocationMapView(props: LocationMapViewProps) {
  return <LocationMapViewInner {...props} />;
}
