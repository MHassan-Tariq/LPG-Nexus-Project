/*
  Warnings:

  - Made the column `adminId` on table `Backup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Bill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Cylinder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `CylinderEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `DailyNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Expense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `InventoryItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `PaymentLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adminId` on table `Restore` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Backup" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Cylinder" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CylinderEntry" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DailyNote" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryItem" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentLog" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Restore" ALTER COLUMN "adminId" SET NOT NULL;
