import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export async function GET() {
  const token = await getAccessToken();
  const session = await getSession();
  if (!session) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    if (token) {
      response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions(), maxAge: 0 });
    }
    return response;
  }
  return NextResponse.json(session);
}
