/*
  Warnings:

  - You are about to drop the column `emptyCylinders` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[adminId,customerId,billStartDate,billEndDate]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[adminId,customerCode]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[adminId,email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[adminId,serialNumber]` on the table `Cylinder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[adminId,noteDate]` on the table `DailyNote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[adminId,key]` on the table `SystemSettings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `adminId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_billId_fkey";

-- DropIndex
DROP INDEX "Bill_customerId_billStartDate_billEndDate_key";

-- DropIndex
DROP INDEX "Customer_customerCode_key";

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Cylinder_serialNumber_key";

-- DropIndex
DROP INDEX "DailyNote_noteDate_key";

-- DropIndex
DROP INDEX "SystemSettings_key_key";

-- AlterTable
ALTER TABLE "Backup" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "emptyCylinders",
ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Cylinder" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "CylinderEntry" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "DailyNote" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "PaymentLog" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "Restore" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminId" TEXT;

-- CreateIndex
CREATE INDEX "Backup_adminId_idx" ON "Backup"("adminId");

-- CreateIndex
CREATE INDEX "Bill_adminId_idx" ON "Bill"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_adminId_customerId_billStartDate_billEndDate_key" ON "Bill"("adminId", "customerId", "billStartDate", "billEndDate");

-- CreateIndex
CREATE INDEX "Customer_adminId_idx" ON "Customer"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_adminId_customerCode_key" ON "Customer"("adminId", "customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_adminId_email_key" ON "Customer"("adminId", "email");

-- CreateIndex
CREATE INDEX "Cylinder_adminId_idx" ON "Cylinder"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Cylinder_adminId_serialNumber_key" ON "Cylinder"("adminId", "serialNumber");

-- CreateIndex
CREATE INDEX "CylinderEntry_adminId_idx" ON "CylinderEntry"("adminId");

-- CreateIndex
CREATE INDEX "CylinderEntry_deliveryDate_idx" ON "CylinderEntry"("deliveryDate");

-- CreateIndex
CREATE INDEX "DailyNote_adminId_idx" ON "DailyNote"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNote_adminId_noteDate_key" ON "DailyNote"("adminId", "noteDate");

-- CreateIndex
CREATE INDEX "Expense_adminId_idx" ON "Expense"("adminId");

-- CreateIndex
CREATE INDEX "InventoryItem_adminId_idx" ON "InventoryItem"("adminId");

-- CreateIndex
CREATE INDEX "Invoice_adminId_idx" ON "Invoice"("adminId");

-- CreateIndex
CREATE INDEX "Payment_adminId_idx" ON "Payment"("adminId");

-- CreateIndex
CREATE INDEX "PaymentLog_adminId_idx" ON "PaymentLog"("adminId");

-- CreateIndex
CREATE INDEX "Restore_adminId_idx" ON "Restore"("adminId");

-- CreateIndex
CREATE INDEX "SystemSettings_adminId_idx" ON "SystemSettings"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_adminId_key_key" ON "SystemSettings"("adminId", "key");

-- CreateIndex
CREATE INDEX "User_adminId_idx" ON "User"("adminId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cylinder" ADD CONSTRAINT "Cylinder_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CylinderEntry" ADD CONSTRAINT "CylinderEntry_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyNote" ADD CONSTRAINT "DailyNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restore" ADD CONSTRAINT "Restore_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
