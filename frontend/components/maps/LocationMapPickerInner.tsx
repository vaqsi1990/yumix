"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import { Crosshair, MapPin } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import {
  cityCenter,
  configureLeafletDefaults,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  parseCoords,
} from "./leaflet-setup";

type MapClickHandlerProps = {
  onSelect: (lat: number, lng: number) => void;
};

function MapClickHandler({ onSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, map, zoom]);

  return null;
}

type DraggableMarkerProps = {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
};

function DraggableMarker({ position, onChange }: DraggableMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;
        const { lat, lng } = marker.getLatLng();
        onChange(lat, lng);
      },
    }),
    [onChange],
  );

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

type LocationMapPickerInnerProps = {
  latitude?: string;
  longitude?: string;
  city?: string;
  onChange: (latitude: string, longitude: string) => void;
  className?: string;
};

export default function LocationMapPickerInner({
  latitude,
  longitude,
  city,
  onChange,
  className,
}: LocationMapPickerInnerProps) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    configureLeafletDefaults();
  }, []);

  const coords = parseCoords(latitude, longitude);
  const center = coords ?? cityCenter(city);
  const hasLocation = coords !== null;

  function selectLocation(lat: number, lng: number) {
    setLocationError("");
    onChange(lat.toFixed(6), lng.toFixed(6));
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError("თქვენი ბრაუზერი მდებარეობის განსაზღვრას არ უჭერს მხარს");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocationError("მდებარეობის მიღება ვერ მოხერხდა. აირჩიეთ რუკაზე ხელით.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2 text-[16px] md:text-[18px]">
          <MapPin
            className={`mt-0.5 size-4 shrink-0 ${hasLocation ? "text-emerald-600" : "text-neutral-400"}`}
          />
          <p className={hasLocation ? "text-emerald-700" : "text-neutral-600"}>
            {hasLocation
              ? "მდებარეობა არჩეულია — საჭიროების შემთხვევაში გადაიტანეთ მარკერი"
              : "დააწკაპუნეთ რუკაზე ან გამოიყენეთ „ჩემი მდებარეობა“"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-white"
          disabled={locating}
          onClick={locateMe}
        >
          <Crosshair className="size-4" />
          {locating ? "მოძებნა..." : "ჩემი მდებარეობა"}
        </Button>
      </div>

      <MapContainer
        center={center}
        zoom={hasLocation ? 16 : 13}
        className="h-[280px] w-full rounded-xl border border-neutral-200 sm:h-[320px]"
        scrollWheelZoom
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        {!hasLocation ? (
          <MapRecenter center={cityCenter(city)} zoom={13} />
        ) : null}
        {coords ? (
          <DraggableMarker position={coords} onChange={selectLocation} />
        ) : null}
        <MapClickHandler onSelect={selectLocation} />
      </MapContainer>

      {locationError ? (
        <p className="mt-2 text-[16px] md:text-[18px] text-destructive">{locationError}</p>
      ) : (
        <p className="mt-2 text-[14px] text-muted-foreground">
          რუკაზე დაწკაპუნებით აირჩიეთ ადგილი, შემდეგ კი საჭიროების შემთხვევაში მარკერი გადაიტანეთ.
        </p>
      )}
    </div>
  );
}
