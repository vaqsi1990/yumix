async function parseError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  const message = data.message ?? data.error ?? "მოთხოვნა ვერ შესრულდა";
  return Array.isArray(message) ? message.join(", ") : message;
}

export async function fetchCourierStatus() {
  const res = await fetch("/api/backend/courier/status");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    isOnline: boolean;
    location: {
      latitude: number | null;
      longitude: number | null;
      updatedAt: string | null;
    };
  }>;
}

export async function setCourierOnlineStatus(isOnline: boolean) {
  const res = await fetch("/api/backend/courier/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isOnline }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ isOnline: boolean }>;
}

export async function updateCourierLocation(payload: {
  latitude: number;
  longitude: number;
}) {
  const res = await fetch("/api/backend/courier/location", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    latitude: number;
    longitude: number;
    updatedAt: string;
  }>;
}

export async function fetchCourierDashboard() {
  const res = await fetch("/api/backend/courier/dashboard");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    isOnline: boolean;
    availableCount: number;
    myActiveCount: number;
    deliveredCount: number;
  }>;
}
