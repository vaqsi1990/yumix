import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getAccessToken, serverApiFetch } from "@/lib/session";
import type { ApiUser } from "@/lib/api";

const f = createUploadthing();

const UPLOAD_ROLES = new Set(["ADMIN", "RESTAURANT_OWNER"]);

async function requireUploadAuth() {
  const token = await getAccessToken();
  if (!token) {
    throw new UploadThingError(
      "ავტორიზაცია საჭიროა — გაიარე შესვლა ადმინ პანელში.",
    );
  }

  let user: ApiUser;
  try {
    const data = await serverApiFetch<{ user: ApiUser }>("/auth/me", { token });
    user = data.user;
  } catch {
    throw new UploadThingError(
      "სერვერი მიუწვდომელია — გაუშვი backend (localhost:3001) და სცადე თავიდან.",
    );
  }

  if (!UPLOAD_ROLES.has(user.role)) {
    throw new UploadThingError("სურათის ატვირთვის უფლება არ გაქვს.");
  }

  return { userId: user.id, role: user.role };
}

export const ourFileRouter = {
  productPhotos: f({
    image: { maxFileSize: "4MB", maxFileCount: 8 },
  })
    .middleware(async () => requireUploadAuth())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  restaurantLogo: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireUploadAuth())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  restaurantCover: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireUploadAuth())
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
