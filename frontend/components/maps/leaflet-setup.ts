import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];

export const CITY_CENTERS: Record<string, [number, number]> = {
  თბილისი: [41.7151, 44.8271],
  ბათუმი: [41.6461, 41.6337],
  ქუთაისი: [42.2679, 42.6946],
  რუსთავი: [41.5493, 44.9932],
};

export function cityCenter(city?: string | null): [number, number] {
  if (!city) return DEFAULT_CENTER;
  return CITY_CENTERS[city] ?? DEFAULT_CENTER;
}

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

let configured = false;

export function configureLeafletDefaults() {
  if (configured) return;
  configured = true;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
  });
}

export function parseCoords(
  latitude?: string | number | null,
  longitude?: string | number | null,
): [number, number] | null {
  const lat =
    typeof latitude === "number"
      ? latitude
      : latitude
        ? Number.parseFloat(latitude)
        : Number.NaN;
  const lng =
    typeof longitude === "number"
      ? longitude
      : longitude
        ? Number.parseFloat(longitude)
        : Number.NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}
