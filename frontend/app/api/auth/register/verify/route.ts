import { NextResponse } from "next/server";
import { AUTH_COOKIE, getApiBaseUrl } from "@/lib/api";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getApiBaseUrl()}/auth/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Verification failed" },
        { status: res.status },
      );
    }

    const response = NextResponse.json({
      user: data.user,
      message: data.message,
    });
    response.cookies.set(AUTH_COOKIE, data.accessToken, cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }
}
