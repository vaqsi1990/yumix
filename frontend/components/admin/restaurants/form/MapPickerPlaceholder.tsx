"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type MapPickerPlaceholderProps = {
  latitude?: string;
  longitude?: string;
  onPick?: () => void;
};

export default function MapPickerPlaceholder({
  latitude,
  longitude,
  onPick,
}: MapPickerPlaceholderProps) {
  const hasCoords = latitude && longitude;

  return (
    <div className="space-y-3">
      <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <MapPin className="relative mb-2 size-10 text-neutral-400" />
        <p className="relative text-[16px] md:text-[18px] font-medium text-neutral-600">
          {hasCoords
            ? `${latitude}, ${longitude}`
            : "რუკა · mock placeholder"}
        </p>
        <p className="relative mt-1 text-[16px] md:text-[18px] text-muted-foreground">
          OpenStreetMap ინტეგრაცია მომავალ ეтапზე
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onPick}
      >
        <MapPin className="size-4" />
        მდებარეობის არჩევა რუკაზე
      </Button>
    </div>
  );
}
