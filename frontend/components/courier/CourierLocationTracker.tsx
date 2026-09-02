"use client";

import { useEffect, useRef } from "react";
import { updateCourierLocation } from "@/lib/courier-api";

const LOCATION_INTERVAL_MS = 20_000;

export default function CourierLocationTracker({
  enabled,
}: {
  enabled: boolean;
}) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) return;

    function sendPosition(position: GeolocationPosition) {
      void updateCourierLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }).catch(() => {
        // GPS optional — do not break courier UI
      });
    }

    function captureLocation() {
      navigator.geolocation.getCurrentPosition(sendPosition, () => undefined, {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 12_000,
      });
    }

    captureLocation();
    intervalRef.current = window.setInterval(captureLocation, LOCATION_INTERVAL_MS);
    watchIdRef.current = navigator.geolocation.watchPosition(
      sendPosition,
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15_000 },
    );

    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled]);

  return null;
}
