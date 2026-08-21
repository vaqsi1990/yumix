export const AUTH_COOKIE = "yumix_token";

/** Keep the session cookie as long as the browser allows (Chrome caps ~400 days). */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function getApiBaseUrl() {
  return (
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

export type ApiUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  avatar?: string | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Browser: call Next BFF proxy (attaches httpOnly JWT). */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `/api/backend${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string })?.message ||
      (data as { error?: string })?.error ||
      "Request failed";
    throw new ApiError(res.status, Array.isArray(message) ? message[0] : message, data);
  }
  return data as T;
}
