"use client";

import dynamic from "next/dynamic";
import type { ResolvedAddress } from "./LocationMapPickerInner";

const LocationMapPickerInner = dynamic(() => import("./LocationMapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <div className="h-10 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
      <div className="h-[220px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
    </div>
  ),
});

type LocationMapPickerProps = {
  latitude?: string;
  longitude?: string;
  city?: string;
  addressQuery?: string;
  onChange: (latitude: string, longitude: string) => void;
  onAddressResolved?: (address: ResolvedAddress) => void;
  className?: string;
};

export type { ResolvedAddress };

export default function LocationMapPicker(props: LocationMapPickerProps) {
  return <LocationMapPickerInner {...props} />;
}
