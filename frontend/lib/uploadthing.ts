import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

/** Same-origin `/api/uploadthing` gets cookies via default `same-origin` credentials. */
const helpersOptions = {
  url: "/api/uploadthing",
} as const;

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>(helpersOptions);

export const UploadButton = generateUploadButton<OurFileRouter>(helpersOptions);
export const UploadDropzone = generateUploadDropzone<OurFileRouter>(helpersOptions);

export type UploadEndpoint = keyof OurFileRouter;

export function fileUrlFromUpload(
  file: { ufsUrl?: string; url?: string } | undefined,
) {
  return file?.ufsUrl ?? file?.url ?? null;
}
