/*
  Warnings:

  - Added the required column `adminId` to the `CylinderTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add adminId as nullable
ALTER TABLE "CylinderTransaction" ADD COLUMN     "adminId" TEXT;

-- Step 2: Populate adminId from related Cylinder's adminId
UPDATE "CylinderTransaction" ct
SET "adminId" = c."adminId"
FROM "Cylinder" c
WHERE ct."cylinderId" = c.id AND ct."adminId" IS NULL;

-- Step 3: For any remaining nulls, assign to first ADMIN user
UPDATE "CylinderTransaction"
SET "adminId" = (
  SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1
)
WHERE "adminId" IS NULL;

-- Step 4: Make adminId required
ALTER TABLE "CylinderTransaction" ALTER COLUMN "adminId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CylinderTransaction_adminId_idx" ON "CylinderTransaction"("adminId");

-- AddForeignKey
ALTER TABLE "CylinderTransaction" ADD CONSTRAINT "CylinderTransaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
