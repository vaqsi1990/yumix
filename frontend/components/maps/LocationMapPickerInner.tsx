"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import {
  configureLeafletDefaults,
  DEFAULT_CENTER,
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

type LocationMapPickerInnerProps = {
  latitude?: string;
  longitude?: string;
  onChange: (latitude: string, longitude: string) => void;
  className?: string;
};

export default function LocationMapPickerInner({
  latitude,
  longitude,
  onChange,
  className,
}: LocationMapPickerInnerProps) {
  useEffect(() => {
    configureLeafletDefaults();
  }, []);

  const coords = parseCoords(latitude, longitude);
  const center = coords ?? DEFAULT_CENTER;

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={coords ? 15 : 12}
        className="h-[220px] w-full rounded-xl border border-neutral-200"
        scrollWheelZoom
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        {coords ? <Marker position={coords} /> : null}
        <MapClickHandler
          onSelect={(lat, lng) =>
            onChange(lat.toFixed(6), lng.toFixed(6))
          }
        />
      </MapContainer>
      <p className="mt-2 text-[14px] text-muted-foreground">
        დააწკაპუნეთ რუკაზე მდებარეობის ასარჩევად
      </p>
    </div>
  );
}
