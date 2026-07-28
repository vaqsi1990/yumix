import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSession } from "@/lib/session";

const f = createUploadthing();

async function requireAdminUpload() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new UploadThingError("Unauthorized");
  }
  return { userId: session.user.id };
}

export const ourFileRouter = {
  productPhotos: f({
    image: { maxFileSize: "4MB", maxFileCount: 8 },
  })
    .middleware(async () => requireAdminUpload())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
  restaurantLogo: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireAdminUpload())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  restaurantCover: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireAdminUpload())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
