"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Marker as LeafletMarker } from "leaflet";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GeocodeResult } from "@/lib/geocode";
import {
  cityCenter,
  configureLeafletDefaults,
  getDefaultMarkerIcon,
  isInGeorgia,
  isValidLatLng,
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
      const { lat, lng } = event.latlng;
      if (!isValidLatLng(lat, lng)) return;
      onSelect(lat, lng);
    },
  });
  return null;
}

function RecenterMap({
  lat,
  lng,
  zoom,
  tick,
}: {
  lat: number;
  lng: number;
  zoom: number;
  tick: number;
}) {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map]);

  useEffect(() => {
    if (tick === 0) return;
    map.invalidateSize();
    map.flyTo([lat, lng], zoom, { duration: 0.45 });
  }, [map, lat, lng, zoom, tick]);

  return null;
}

type DraggableMarkerProps = {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
};

function DraggableMarker({ position, onChange }: DraggableMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;
        const { lat, lng } = marker.getLatLng();
        if (!isValidLatLng(lat, lng)) return;
        onChange(lat, lng);
      },
    }),
    [onChange],
  );

  if (!isValidLatLng(position[0], position[1])) return null;

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      icon={getDefaultMarkerIcon()}
      ref={markerRef}
    />
  );
}

export type ResolvedAddress = {
  displayName: string;
  city: string;
  street: string;
  country: string;
  postalCode: string;
};

type LocationMapPickerInnerProps = {
  latitude?: string;
  longitude?: string;
  city?: string;
  addressQuery?: string;
  onChange: (latitude: string, longitude: string) => void;
  onAddressResolved?: (address: ResolvedAddress) => void;
  className?: string;
};

async function searchAddress(
  query: string,
  city?: string,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q: query });
  if (city?.trim()) params.set("city", city.trim());
  const res = await fetch(`/api/geocode/search?${params.toString()}`);
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}

async function reverseAddress(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const res = await fetch(`/api/geocode/reverse?${params.toString()}`);
  const data = (await res.json()) as { result?: GeocodeResult | null };
  return data.result ?? null;
}

function formatAccuracy(meters: number) {
  if (meters >= 1000) return `~${(meters / 1000).toFixed(1)} კმ`;
  return `~${Math.round(meters)} მ`;
}

export default function LocationMapPickerInner({
  latitude,
  longitude,
  city,
  addressQuery,
  onChange,
  onAddressResolved,
  className,
}: LocationMapPickerInnerProps) {
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [locateTick, setLocateTick] = useState(0);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState(addressQuery ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState("");
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const skipNextQuerySync = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseSeq = useRef(0);
  const locateWatchRef = useRef<number | null>(null);
  const locateTimerRef = useRef<number | null>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    configureLeafletDefaults();
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (skipNextQuerySync.current) {
      skipNextQuerySync.current = false;
      return;
    }
    if (addressQuery != null) {
      setQuery(addressQuery);
    }
  }, [addressQuery]);

  const coords = useMemo(
    () => parseCoords(latitude, longitude),
    [latitude, longitude],
  );
  const center = useMemo<[number, number]>(() => {
    if (coords && isValidLatLng(coords[0], coords[1])) return coords;
    return cityCenter(city);
  }, [city, coords]);
  const hasLocation = coords !== null && isValidLatLng(coords[0], coords[1]);

  function updateMenuPosition() {
    const el = inputWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!openSuggestions) {
      setMenuBox(null);
      return;
    }
    updateMenuPosition();
    function onReposition() {
      updateMenuPosition();
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [openSuggestions, suggestions.length]);

  function emitAddress(result: GeocodeResult) {
    const resolved: ResolvedAddress = {
      displayName: result.displayName,
      city: result.city,
      street: result.street,
      country: result.country,
      postalCode: result.postalCode,
    };
    setResolvedLabel(result.displayName);
    onAddressResolved?.(resolved);
  }

  function selectLocation(
    lat: number,
    lng: number,
    options?: { reverse?: boolean; result?: GeocodeResult },
  ) {
    if (!isValidLatLng(lat, lng)) return;
    setLocationError("");
    onChange(lat.toFixed(6), lng.toFixed(6));

    if (options?.result) {
      emitAddress(options.result);
      return;
    }

    if (options?.reverse === false) return;

    const seq = ++reverseSeq.current;
    setReversing(true);
    void reverseAddress(lat, lng)
      .then((result) => {
        if (seq !== reverseSeq.current) return;
        if (!result) {
          setResolvedLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          return;
        }
        skipNextQuerySync.current = true;
        setQuery(result.street || result.displayName);
        emitAddress(result);
      })
      .catch(() => {
        if (seq !== reverseSeq.current) return;
        setResolvedLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      })
      .finally(() => {
        if (seq === reverseSeq.current) setReversing(false);
      });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setLocationError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpenSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      void searchAddress(value, city)
        .then((results) => {
          setSuggestions(results);
          setOpenSuggestions(results.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setOpenSuggestions(false);
        })
        .finally(() => setSearching(false));
    }, 450);
  }

  async function runSearch(explicitQuery?: string) {
    const q = (explicitQuery ?? query).trim();
    if (q.length < 2) {
      setLocationError("ჩაწერეთ მისამართი ძებნისთვის");
      return;
    }

    setSearching(true);
    setLocationError("");
    try {
      const results = await searchAddress(q, city);
      setSuggestions(results);
      setOpenSuggestions(results.length > 0);
      if (results.length === 0) {
        setLocationError("მისამართი ვერ მოიძებნა");
        return;
      }
      applySuggestion(results[0]);
    } catch {
      setLocationError("მისამართის ძებნა ვერ მოხერხდა");
    } finally {
      setSearching(false);
    }
  }

  function applySuggestion(result: GeocodeResult) {
    skipNextQuerySync.current = true;
    setQuery(result.street || result.displayName);
    setSuggestions([]);
    setOpenSuggestions(false);
    selectLocation(result.lat, result.lng, {
      reverse: false,
      result,
    });
  }

  function stopLocating() {
    if (locateWatchRef.current != null) {
      navigator.geolocation.clearWatch(locateWatchRef.current);
      locateWatchRef.current = null;
    }
    if (locateTimerRef.current != null) {
      window.clearTimeout(locateTimerRef.current);
      locateTimerRef.current = null;
    }
    setLocating(false);
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError("თქვენი ბრაუზერი მდებარეობის განსაზღვრას არ უჭერს მხარს");
      return;
    }

    stopLocating();
    setLocating(true);
    setLocationError("");
    setLocationHint("");

    let bestAccuracy = Number.POSITIVE_INFINITY;
    let gotFix = false;

    const applyFix = (coords: GeolocationCoordinates) => {
      const lat = coords.latitude;
      const lng = coords.longitude;
      if (!isValidLatLng(lat, lng)) return;
      if (!isInGeorgia(lat, lng)) {
        setLocationError(
          "ბრაუზერმა მდებარეობა საქართველოს გარეთ დააბრუნა. აირჩიე რუკაზე ხელით.",
        );
        return;
      }
      gotFix = true;
      setFlyTo([lat, lng]);
      setLocateTick((n) => n + 1);
      selectLocation(lat, lng);
      if (coords.accuracy > 200) {
        setLocationHint(
          `ბრაუზერის სიზუსტე ${formatAccuracy(coords.accuracy)} — ეს კომპიუტერის ქსელის მდებარეობაა, არა GPS. გადაიტანე მარკერი ზუსტ ადგილზე.`,
        );
      } else {
        setLocationHint("");
      }
    };

    locateWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { coords } = position;
        if (coords.accuracy >= bestAccuracy) {
          if (coords.accuracy <= 40) stopLocating();
          return;
        }
        bestAccuracy = coords.accuracy;
        applyFix(coords);
        if (coords.accuracy <= 40) stopLocating();
      },
      (error) => {
        if (gotFix || error.code === error.TIMEOUT) return;
        stopLocating();
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "მდებარეობაზე წვდომა აკრძალულია. აირჩიე რუკაზე ხელით.",
          );
          return;
        }
        setLocationError(
          "მდებარეობის მიღება ვერ მოხერხდა. აირჩიეთ რუკაზე ხელით.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );

    locateTimerRef.current = window.setTimeout(() => {
      if (gotFix) {
        stopLocating();
        return;
      }
      stopLocating();
      setLocationError(
        (prev) =>
          prev || "მდებარეობის მიღება ვერ მოხერხდა. აირჩიეთ რუკაზე ხელით.",
      );
    }, 8000);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (locateWatchRef.current != null) {
        navigator.geolocation.clearWatch(locateWatchRef.current);
      }
      if (locateTimerRef.current != null) {
        window.clearTimeout(locateTimerRef.current);
      }
    };
  }, []);

  const suggestionsMenu =
    portalReady &&
    openSuggestions &&
    suggestions.length > 0 &&
    menuBox
      ? createPortal(
          <ul
            className="fixed z-[5000] max-h-64 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-xl"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            role="listbox"
          >
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(item)}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#FF0050]" />
                  <span className="text-neutral-800">{item.displayName}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={className}>
      <div className="relative z-[1100] mb-3 space-y-2">
        <label className="text-sm font-medium text-neutral-800">
          მისამართის ძებნა
        </label>
        <div className="flex gap-2">
          <div ref={inputWrapRef} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setOpenSuggestions(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setOpenSuggestions(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch();
                }
                if (e.key === "Escape") {
                  setOpenSuggestions(false);
                }
              }}
              placeholder="მაგ. რუსთაველის გამზირი 1, თბილისი"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 bg-white"
            disabled={searching}
            onClick={() => void runSearch()}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "მოძებნა"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 bg-white"
            disabled={locating}
            onClick={locateMe}
            title="ჩემი მდებარეობა"
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {suggestionsMenu}

      <div className="mb-3 flex items-start gap-2 text-[16px] md:text-[18px]">
        <MapPin
          className={`mt-0.5 size-4 shrink-0 ${hasLocation ? "text-emerald-600" : "text-neutral-400"}`}
        />
        <p className={hasLocation ? "text-emerald-700" : "text-neutral-600"}>
          {reversing
            ? "მისამართი განისაზღვრება..."
            : resolvedLabel
              ? resolvedLabel
              : hasLocation
                ? "მდებარეობა არჩეულია — საჭიროების შემთხვევაში გადაიტანეთ მარკერი"
                : "ჩაწერეთ მისამართი ან დააწკაპუნეთ რუკაზე"}
        </p>
      </div>

      <MapContainer
        center={center}
        zoom={hasLocation ? 16 : 13}
        className="relative z-0 h-[280px] w-full rounded-xl border border-neutral-200 sm:h-[320px]"
        scrollWheelZoom
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <RecenterMap
          lat={flyTo?.[0] ?? center[0]}
          lng={flyTo?.[1] ?? center[1]}
          zoom={flyTo || hasLocation ? 17 : 13}
          tick={locateTick}
        />
        {hasLocation && coords ? (
          <DraggableMarker
            position={coords}
            onChange={(lat, lng) => selectLocation(lat, lng)}
          />
        ) : null}
        <MapClickHandler onSelect={(lat, lng) => selectLocation(lat, lng)} />
      </MapContainer>

      {locationError ? (
        <p className="mt-2 text-[16px] md:text-[18px] text-destructive">
          {locationError}
        </p>
      ) : locationHint ? (
        <p className="mt-2 text-[16px] md:text-[18px] text-amber-700">
          {locationHint}
        </p>
      ) : (
        <p className="mt-2 text-[14px] text-muted-foreground">
          მისამართი შეიყვანეთ ზემოთ — pin ავტომატურად დადგება Leaflet რუკაზე და
          შეინახება ფორმასთან ერთად.
        </p>
      )}
    </div>
  );
}
