import L from "leaflet";

export const DEFAULT_CENTER: [number, number] = [41.7151, 44.8271];

export const CITY_CENTERS: Record<string, [number, number]> = {
  თბილისი: [41.7151, 44.8271],
  ბათუმი: [41.6461, 41.6337],
  ქუთაისი: [42.2679, 42.6946],
  რუსთავი: [41.5493, 44.9932],
};

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Delivery area — reject ISP/VPN pins that land outside Georgia. */
export function isInGeorgia(lat: number, lng: number): boolean {
  return lat >= 40.9 && lat <= 43.9 && lng >= 39.8 && lng <= 46.9;
}

/** Always return a fresh tuple — Leaflet may mutate LatLng arrays in place. */
export function cityCenter(city?: string | null): [number, number] {
  const key = city?.trim();
  const found = key ? CITY_CENTERS[key] : undefined;
  const base = found ?? DEFAULT_CENTER;
  return [base[0], base[1]];
}

export function safeMapCenter(
  latitude?: string | number | null,
  longitude?: string | number | null,
  city?: string | null,
): [number, number] {
  return parseCoords(latitude, longitude) ?? cityCenter(city);
}

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const MARKER_ICON_URL = "/leaflet/marker-icon.png";
const MARKER_ICON_2X_URL = "/leaflet/marker-icon-2x.png";
const MARKER_SHADOW_URL = "/leaflet/marker-shadow.png";

let configured = false;
let markerIcon: L.Icon | null = null;

export function configureLeafletDefaults() {
  if (typeof window === "undefined") return;
  if (configured) return;
  configured = true;

  // Webpack/Next breaks Leaflet's default icon URL detection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: MARKER_ICON_URL,
    iconRetinaUrl: MARKER_ICON_2X_URL,
    shadowUrl: MARKER_SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
}

/** Explicit marker icon — pass to <Marker icon={...} /> so pins never break. */
export function getDefaultMarkerIcon(): L.Icon {
  configureLeafletDefaults();
  if (!markerIcon) {
    markerIcon = new L.Icon({
      iconUrl: MARKER_ICON_URL,
      iconRetinaUrl: MARKER_ICON_2X_URL,
      shadowUrl: MARKER_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
  }
  return markerIcon;
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

  if (!isValidLatLng(lat, lng)) return null;
  return [lat, lng];
}
