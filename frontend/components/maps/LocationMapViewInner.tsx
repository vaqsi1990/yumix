"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import {
  configureLeafletDefaults,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  parseCoords,
} from "./leaflet-setup";

type LocationMapViewInnerProps = {
  latitude: number;
  longitude: number;
  className?: string;
};

export default function LocationMapViewInner({
  latitude,
  longitude,
  className,
}: LocationMapViewInnerProps) {
  useEffect(() => {
    configureLeafletDefaults();
  }, []);

  const coords = parseCoords(latitude, longitude);
  if (!coords) return null;

  return (
    <div className={className}>
      <MapContainer
        center={coords}
        zoom={15}
        className="h-64 w-full rounded-xl border border-neutral-200"
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <Marker position={coords} />
      </MapContainer>
    </div>
  );
}
