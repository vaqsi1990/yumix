import { NextResponse } from "next/server";
import { nominatimReverse } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(searchParams.get("lng") ?? "");

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ message: "არასწორი კოორდინატები" }, { status: 400 });
  }

  try {
    const result = await nominatimReverse(lat, lng);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { message: "მისამართის განსაზღვრა ვერ მოხერხდა", result: null },
      { status: 502 },
    );
  }
}
