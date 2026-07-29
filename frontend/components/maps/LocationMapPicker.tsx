"use client";

import dynamic from "next/dynamic";

const LocationMapPickerInner = dynamic(() => import("./LocationMapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
  ),
});

type LocationMapPickerProps = {
  latitude?: string;
  longitude?: string;
  onChange: (latitude: string, longitude: string) => void;
  className?: string;
};

export default function LocationMapPicker(props: LocationMapPickerProps) {
  return <LocationMapPickerInner {...props} />;
}
