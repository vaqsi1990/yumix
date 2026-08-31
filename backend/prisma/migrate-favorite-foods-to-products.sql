-- Migrates HomeFavoriteFood from category tiles to direct product picks.
-- Clears existing homepage picks; re-add them in /admin/favorite-foods.

DELETE FROM "HomeFavoriteFood";

ALTER TABLE "HomeFavoriteFood" DROP CONSTRAINT IF EXISTS "HomeFavoriteFood_slug_key";
ALTER TABLE "HomeFavoriteFood" DROP CONSTRAINT IF EXISTS "HomeFavoriteFood_productId_fkey";

ALTER TABLE "HomeFavoriteFood" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "HomeFavoriteFood" DROP COLUMN IF EXISTS "label";
ALTER TABLE "HomeFavoriteFood" DROP COLUMN IF EXISTS "image";

ALTER TABLE "HomeFavoriteFood" ADD COLUMN IF NOT EXISTS "productId" TEXT;

DROP INDEX IF EXISTS "HomeFavoriteFood_productId_key";

ALTER TABLE "HomeFavoriteFood"
  ADD CONSTRAINT "HomeFavoriteFood_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "HomeFavoriteFood_productId_key"
  ON "HomeFavoriteFood"("productId");

ALTER TABLE "HomeFavoriteFood" ALTER COLUMN "productId" SET NOT NULL;
