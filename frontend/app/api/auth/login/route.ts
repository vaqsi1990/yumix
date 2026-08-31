import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, getApiBaseUrl } from "@/lib/api";

const cookieOptions = authCookieOptions();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Login failed" },
        { status: res.status },
      );
    }

    const response = NextResponse.json({ user: data.user });
    response.cookies.set(AUTH_COOKIE, data.accessToken, cookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
