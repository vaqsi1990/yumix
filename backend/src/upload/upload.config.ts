/** EU Central — Frankfurt (matches Vercel/Render/Supabase eu-central-1). */
export const UPLOADTHING_REGION = 'fra1';
export const UPLOADTHING_INGEST_URL = `https://${UPLOADTHING_REGION}.ingest.uploadthing.com`;

/**
 * UploadThing v7 expects UPLOADTHING_TOKEN (base64 JSON from dashboard).
 * Builds a compatible token from legacy UPLOADTHING_SECRET + APP_ID when needed.
 */
export function resolveUploadThingToken(config: {
  get: (key: string) => string | undefined;
}): string | undefined {
  const token = config.get('UPLOADTHING_TOKEN')?.trim();
  if (token) return token;

  const secret = config.get('UPLOADTHING_SECRET')?.trim();
  const appId = config.get('UPLOADTHING_APP_ID')?.trim();
  if (!secret || !appId) return undefined;

  return Buffer.from(
    JSON.stringify({
      apiKey: secret,
      appId,
      regions: [UPLOADTHING_REGION],
      ingestHost: 'ingest.uploadthing.com',
    }),
  ).toString('base64');
}
