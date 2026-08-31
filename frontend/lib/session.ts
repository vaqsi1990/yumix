import { cookies } from "next/headers";
import { AUTH_COOKIE, getApiBaseUrl, type ApiUser } from "@/lib/api";

export type Session = {
  user: ApiUser;
};

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value ?? null;
}

/** Server-side call to Nest with Bearer from httpOnly cookie. */
export async function serverApiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T> {
  const token = init?.token !== undefined ? init.token : await getAccessToken();
  const { token: _t, ...rest } = init ?? {};
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string })?.message ||
      (data as { error?: string })?.error ||
      "Request failed";
    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message),
    );
  }
  return data as T;
}

export async function getSession(): Promise<Session | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const data = await serverApiFetch<{ user: ApiUser }>("/auth/me", { token });
    return { user: data.user };
  } catch {
    return null;
  }
}
