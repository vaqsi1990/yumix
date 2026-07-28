import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Reset failed" },
        { status: res.status },
      );
    }

    return NextResponse.json({ message: data.message });
  } catch {
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
