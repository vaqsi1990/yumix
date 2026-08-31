const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateAdminImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "მხოლოდ JPG, PNG, WebP ან GIF ფაილებია დაშვებული.";
  }
  if (file.size > MAX_BYTES) {
    return "ფაილი ძალიან დიდია (max 4MB).";
  }
  return null;
}

export async function uploadAdminImage(file: File): Promise<string> {
  const validationError = validateAdminImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/backend/upload/image", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || data.message || "ატვირთვა ვერ მოხერხდა");
  }

  if (!data.url) {
    throw new Error("ატვირთვა დასრულდა, მაგრამ URL ვერ მოიძებნა");
  }

  return data.url;
}
