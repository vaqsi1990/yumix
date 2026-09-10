DO $$ BEGIN
  CREATE TYPE "ProductApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "approvalStatus" "ProductApprovalStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Product"
SET "approvalStatus" = 'APPROVED'
WHERE "approvalStatus" = 'PENDING';
