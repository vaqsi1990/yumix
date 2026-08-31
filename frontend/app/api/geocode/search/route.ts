import { NextResponse } from "next/server";
import { nominatimSearch } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await nominatimSearch(q, {
      city: city || undefined,
      limit: 6,
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { message: "მისამართის ძებნა ვერ მოხერხდა", results: [] },
      { status: 502 },
    );
  }
}
