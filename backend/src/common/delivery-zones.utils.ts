export type DeliveryZoneInput = {
  id?: string;
  name: string;
  maxDistanceKm?: number;
  deliveryFee: number;
  minimumOrder?: number;
  estimatedMinutes: number;
  sortOrder?: number;
};

export function normalizeDeliveryZones(
  zones: DeliveryZoneInput[] | undefined,
  fallbackRadius?: number | null,
) {
  if (!Array.isArray(zones) || zones.length === 0) return [];

  return zones
    .map((zone, index) => ({
      name: String(zone.name ?? '').trim(),
      maxDistanceKm:
        zone.maxDistanceKm != null && Number.isFinite(zone.maxDistanceKm)
          ? Number(zone.maxDistanceKm)
          : fallbackRadius != null && Number.isFinite(fallbackRadius)
            ? Number(fallbackRadius)
            : (index + 1) * 3,
      deliveryFee: Number(zone.deliveryFee ?? 0),
      minimumOrder:
        zone.minimumOrder != null ? Number(zone.minimumOrder) : null,
      estimatedMinutes: Math.max(1, Number(zone.estimatedMinutes ?? 30)),
      sortOrder: zone.sortOrder ?? index,
    }))
    .filter((zone) => zone.name.length > 0)
    .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
}
