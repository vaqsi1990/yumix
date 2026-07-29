export async function parseApiError(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as {
      message?: string | string[];
      error?: string | string[];
    };
    const message = data.message ?? data.error;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  } catch {
    // ignore
  }
  return fallback;
}
