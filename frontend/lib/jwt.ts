import { createHmac, timingSafeEqual } from "crypto";
import type { ApiUser } from "@/lib/api";

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
};

function base64UrlDecode(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function decodePayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]).toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

function jwtNeverExpires(): boolean {
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim();
  return !expiresIn || expiresIn === "never" || expiresIn === "0";
}

function isExpired(payload: JwtPayload): boolean {
  if (jwtNeverExpires() || !payload.exp) return false;
  return payload.exp * 1000 < Date.now();
}

function payloadToUser(payload: JwtPayload): ApiUser | null {
  if (!payload.sub || !payload.email) return null;
  const firstName = payload.firstName ?? "";
  const lastName = payload.lastName ?? "";
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role ?? "USER",
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || payload.email,
  };
}

function verifySignature(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Validate JWT locally so sessions survive brief backend outages. */
export function sessionFromAccessToken(
  token: string,
): { user: ApiUser } | null {
  const payload = decodePayload(token);
  if (!payload || isExpired(payload)) return null;

  const secret = process.env.JWT_SECRET?.trim();
  if (secret && !verifySignature(token, secret)) return null;

  const user = payloadToUser(payload);
  return user ? { user } : null;
}
