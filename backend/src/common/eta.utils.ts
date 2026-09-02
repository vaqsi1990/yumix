const DEFAULT_PREP_MINUTES = 25;
const MIN_PREP_MINUTES = 15;
const PREP_RANGE_PADDING = 5;

/** Urban delivery: minutes per km (min / max). */
const TRAVEL_MIN_PER_KM = 2.5;
const TRAVEL_MAX_PER_KM = 4;
const DEFAULT_TRAVEL_MIN = 15;
const DEFAULT_TRAVEL_MAX = 25;
const MIN_TRAVEL_MINUTES = 5;

export type DeliveryEta = {
  prepMin: number;
  prepMax: number;
  travelMin: number;
  travelMax: number;
  totalMin: number;
  totalMax: number;
  prepLabel: string;
  travelLabel: string;
  totalLabel: string;
  label: string;
};

export function formatMinuteRange(min: number, max: number) {
  return `${min}–${max} წთ`;
}

export function calculatePreparationMinutes(
  prepTimes: Array<number | null | undefined>,
) {
  const values = prepTimes
    .map((value) => (value != null && value > 0 ? value : DEFAULT_PREP_MINUTES))
    .filter((value) => Number.isFinite(value));

  const maxPrep = Math.max(
    MIN_PREP_MINUTES,
    values.length > 0 ? Math.max(...values) : DEFAULT_PREP_MINUTES,
  );

  return {
    min: Math.max(10, maxPrep - PREP_RANGE_PADDING),
    max: maxPrep + PREP_RANGE_PADDING,
  };
}

export function calculateTravelMinutes(distanceKm: number | null | undefined) {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return { min: DEFAULT_TRAVEL_MIN, max: DEFAULT_TRAVEL_MAX };
  }

  const min = Math.max(
    MIN_TRAVEL_MINUTES,
    Math.round(distanceKm * TRAVEL_MIN_PER_KM),
  );
  const max = Math.max(min + 5, Math.round(distanceKm * TRAVEL_MAX_PER_KM));
  return { min, max };
}

export function calculateDeliveryEta(
  prepTimes: Array<number | null | undefined>,
  distanceKm: number | null | undefined,
): DeliveryEta {
  const prep = calculatePreparationMinutes(prepTimes);
  const travel = calculateTravelMinutes(distanceKm);
  const totalMin = prep.min + travel.min;
  const totalMax = prep.max + travel.max;

  return {
    prepMin: prep.min,
    prepMax: prep.max,
    travelMin: travel.min,
    travelMax: travel.max,
    totalMin,
    totalMax,
    prepLabel: formatMinuteRange(prep.min, prep.max),
    travelLabel: formatMinuteRange(travel.min, travel.max),
    totalLabel: formatMinuteRange(totalMin, totalMax),
    label: `მიწოდება დაახლოებით ${totalMin}–${totalMax} წუთში`,
  };
}

export function etaFromOrderSnapshot(order: {
  etaPrepMin?: number | null;
  etaPrepMax?: number | null;
  etaTravelMin?: number | null;
  etaTravelMax?: number | null;
  etaTotalMin?: number | null;
  etaTotalMax?: number | null;
  estimatedTime?: number | null;
}): DeliveryEta | null {
  if (
    order.etaTotalMin != null &&
    order.etaTotalMax != null &&
    order.etaPrepMin != null &&
    order.etaPrepMax != null &&
    order.etaTravelMin != null &&
    order.etaTravelMax != null
  ) {
    return {
      prepMin: order.etaPrepMin,
      prepMax: order.etaPrepMax,
      travelMin: order.etaTravelMin,
      travelMax: order.etaTravelMax,
      totalMin: order.etaTotalMin,
      totalMax: order.etaTotalMax,
      prepLabel: formatMinuteRange(order.etaPrepMin, order.etaPrepMax),
      travelLabel: formatMinuteRange(order.etaTravelMin, order.etaTravelMax),
      totalLabel: formatMinuteRange(order.etaTotalMin, order.etaTotalMax),
      label: `მიწოდება დაახლოებით ${order.etaTotalMin}–${order.etaTotalMax} წუთში`,
    };
  }

  if (order.estimatedTime != null && order.estimatedTime > 0) {
    const total = order.estimatedTime;
    return {
      prepMin: Math.max(10, total - 20),
      prepMax: total - 10,
      travelMin: 10,
      travelMax: 20,
      totalMin: Math.max(10, total - 10),
      totalMax: total,
      prepLabel: formatMinuteRange(Math.max(10, total - 20), total - 10),
      travelLabel: formatMinuteRange(10, 20),
      totalLabel: formatMinuteRange(Math.max(10, total - 10), total),
      label: `მიწოდება დაახლოებით ${Math.max(10, total - 10)}–${total} წუთში`,
    };
  }

  return null;
}
