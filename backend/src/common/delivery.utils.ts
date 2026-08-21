export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} მ`;
  return `${km.toFixed(1)} კმ`;
}

export type DeliveryPricing = {
  deliveryFee: number | null | undefined;
  deliveryFeePerKm: number | null | undefined;
  deliveryRadius: number | null | undefined;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
};

export type DeliveryQuote = {
  fee: number;
  distanceKm: number | null;
  outOfRange: boolean;
};

function roundMoney(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

export function quoteDeliveryFee(
  restaurant: DeliveryPricing,
  dest?: { latitude: number | null; longitude: number | null } | null,
): DeliveryQuote {
  const base = Number(restaurant.deliveryFee ?? 0);
  const perKm = Number(restaurant.deliveryFeePerKm ?? 0);
  const radius = restaurant.deliveryRadius;
  const destLat = dest?.latitude;
  const destLng = dest?.longitude;
  const fromLat = restaurant.latitude;
  const fromLng = restaurant.longitude;

  if (
    destLat == null ||
    destLng == null ||
    fromLat == null ||
    fromLng == null ||
    !Number.isFinite(destLat) ||
    !Number.isFinite(destLng) ||
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng)
  ) {
    return { fee: roundMoney(base), distanceKm: null, outOfRange: false };
  }

  const distanceKm = haversineKm(fromLat, fromLng, destLat, destLng);
  const outOfRange =
    radius != null && Number.isFinite(radius) && distanceKm > radius;

  return {
    fee: roundMoney(base + distanceKm * (Number.isFinite(perKm) ? perKm : 0)),
    distanceKm: Number(distanceKm.toFixed(2)),
    outOfRange,
  };
}

export function formatMoneyLabel(amount: number | null | undefined) {
  if (amount == null) return '—';
  if (amount === 0) return 'უფასო';
  return `₾${amount.toFixed(2)}`;
}

export function formatDeliveryFeeLabel(
  deliveryFee: number | null | undefined,
  deliveryFeePerKm?: number | null,
) {
  const base = deliveryFee ?? 0;
  const perKm = deliveryFeePerKm ?? 0;
  if (base <= 0 && perKm <= 0) return 'უფასო';
  const baseLabel = `₾${base.toFixed(2)}`;
  if (perKm > 0) return `${baseLabel} + ₾${perKm.toFixed(2)}/კმ`;
  return baseLabel;
}
