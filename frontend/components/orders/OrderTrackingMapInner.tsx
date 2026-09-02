"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import {
  configureLeafletDefaults,
  getDefaultMarkerIcon,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  parseCoords,
} from "../maps/leaflet-setup";

type MapPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

export default function OrderTrackingMapInner({
  points,
  className,
}: {
  points: MapPoint[];
  className?: string;
}) {
  useEffect(() => {
    configureLeafletDefaults();
  }, []);

  const parsed = points
    .map((point) => ({
      ...point,
      coords: parseCoords(point.latitude, point.longitude),
    }))
    .filter((point) => point.coords != null);

  if (parsed.length === 0) return null;

  const center = parsed[0].coords!;

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={14}
        className="h-64 w-full rounded-xl border border-neutral-200"
        scrollWheelZoom={false}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        {parsed.map((point, index) => (
          <Marker
            key={`${point.latitude}-${point.longitude}-${index}`}
            position={point.coords!}
            icon={getDefaultMarkerIcon()}
          />
        ))}
      </MapContainer>
    </div>
  );
}
