export type GeocodeResult = {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  street: string;
  country: string;
  postalCode: string;
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  residential?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

const NOMINATIM_UA = "YumixFoodDelivery/1.0 (https://yumix.ge; contact@yumix.ge)";

function pickStreet(address?: NominatimAddress): string {
  if (!address) return "";
  const road =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.residential ||
    "";
  if (road && address.house_number) return `${road} ${address.house_number}`;
  return road;
}

function pickCity(address?: NominatimAddress): string {
  if (!address) return "";
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  );
}

export function mapNominatimItem(item: NominatimItem): GeocodeResult | null {
  const lat = Number.parseFloat(item.lat);
  const lng = Number.parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const street = pickStreet(item.address);
  const city = pickCity(item.address);

  return {
    id: String(item.place_id),
    lat,
    lng,
    displayName: item.display_name,
    city,
    street: street || item.display_name.split(",")[0]?.trim() || "",
    country: item.address?.country || "საქართველო",
    postalCode: item.address?.postcode || "",
  };
}

export async function nominatimSearch(
  query: string,
  options?: { limit?: number; city?: string },
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const searchQuery = options?.city?.trim()
    ? `${q}, ${options.city.trim()}, Georgia`
    : `${q}, Georgia`;

  const params = new URLSearchParams({
    q: searchQuery,
    format: "json",
    addressdetails: "1",
    limit: String(options?.limit ?? 6),
    countrycodes: "ge",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_UA,
      },
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    throw new Error("მისამართის ძებნა ვერ მოხერხდა");
  }

  const data = (await res.json()) as NominatimItem[];
  return data
    .map(mapNominatimItem)
    .filter((item): item is GeocodeResult => item != null);
}

export async function nominatimReverse(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    zoom: "18",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_UA,
      },
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    throw new Error("მისამართის განსაზღვრა ვერ მოხერხდა");
  }

  const data = (await res.json()) as NominatimItem & { error?: string };
  if (data.error) return null;
  return mapNominatimItem(data);
}
