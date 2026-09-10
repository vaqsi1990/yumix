import { haversineKm } from './delivery.utils';

const ROAD_DISTANCE_FACTOR = 1.35;

export async function estimateDrivingDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): Promise<number> {
  const straight = haversineKm(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude,
  );

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return Number((straight * ROAD_DISTANCE_FACTOR).toFixed(2));

    const data = (await res.json()) as {
      routes?: Array<{ distance?: number }>;
    };
    const meters = data.routes?.[0]?.distance;
    if (meters == null || !Number.isFinite(meters)) {
      return Number((straight * ROAD_DISTANCE_FACTOR).toFixed(2));
    }
    return Number((meters / 1000).toFixed(2));
  } catch {
    return Number((straight * ROAD_DISTANCE_FACTOR).toFixed(2));
  }
}

export async function estimateDrivingMinutes(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      routes?: Array<{ duration?: number }>;
    };
    const seconds = data.routes?.[0]?.duration;
    if (seconds == null || !Number.isFinite(seconds)) return null;
    return Math.max(5, Math.round(seconds / 60));
  } catch {
    return null;
  }
}
