-- CreateEnum
CREATE TYPE "CylinderStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ISSUE', 'RETURN', 'MAINTENANCE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('HOME', 'OTHER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PAID', 'PARTIALLY_PAID', 'NOT_PAID');

-- CreateEnum
CREATE TYPE "PaymentEventType" AS ENUM ('BILL_GENERATED', 'BILL_UPDATED', 'BILL_DELETED', 'PAYMENT_RECEIVED', 'PARTIAL_PAYMENT', 'INVOICE_GENERATED', 'INVOICE_DOWNLOADED', 'INVOICE_DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER', 'BRANCH_MANAGER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "cylinderType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "vendor" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "department" TEXT,
    "branch" TEXT,
    "profileImage" TEXT,
    "companyDescription" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "country" TEXT,
    "passwordHash" TEXT,
    "businessName" TEXT,
    "billTemplateDesign" JSONB,
    "billPresets" JSONB,
    "reportTemplateDesign" JSONB,
    "reportPresets" JSONB,
    "themePreferences" JSONB,
    "logoCustomUpload" TEXT,
    "fontPreferences" JSONB,
    "permissions" JSONB,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT,
    "customerType" TEXT NOT NULL,
    "cylinderType" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "securityDeposit" INTEGER,
    "area" TEXT,
    "city" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "additionalContacts" JSONB,
    "emptyCylinders" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cylinder" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "gasType" TEXT NOT NULL,
    "capacityLiters" INTEGER NOT NULL,
    "status" "CylinderStatus" NOT NULL DEFAULT 'IN_STOCK',
    "location" TEXT NOT NULL,
    "pressurePsi" DOUBLE PRECISION,
    "lastInspection" TIMESTAMP(3),
    "nextInspection" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,

    CONSTRAINT "Cylinder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CylinderTransaction" (
    "id" TEXT NOT NULL,
    "cylinderId" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CylinderTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CylinderEntry" (
    "id" TEXT NOT NULL,
    "billCreatedBy" TEXT NOT NULL,
    "cylinderType" TEXT NOT NULL,
    "cylinderLabel" TEXT,
    "deliveredBy" TEXT,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentType" TEXT,
    "paymentAmount" INTEGER,
    "paymentReceivedBy" TEXT,
    "emptyCylinderReceived" INTEGER,

    CONSTRAINT "CylinderEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'HOME',
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "billStartDate" TIMESTAMP(3) NOT NULL,
    "billEndDate" TIMESTAMP(3) NOT NULL,
    "lastMonthRemaining" INTEGER NOT NULL DEFAULT 0,
    "currentMonthBill" INTEGER NOT NULL DEFAULT 0,
    "cylinders" INTEGER NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'NOT_PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT DEFAULT 'bank_transfer',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "billId" TEXT,
    "paymentId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerCode" INTEGER,
    "eventType" "PaymentEventType" NOT NULL,
    "amount" INTEGER,
    "details" TEXT,
    "billStartDate" TIMESTAMP(3),
    "billEndDate" TIMESTAMP(3),
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyNote" (
    "id" TEXT NOT NULL,
    "noteDate" TIMESTAMP(3) NOT NULL,
    "noteText" TEXT NOT NULL DEFAULT '',
    "sections" JSONB NOT NULL,
    "labels" TEXT[],
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "backupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restore" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "restoreDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminAccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdminAccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryItem_entryDate_idx" ON "InventoryItem"("entryDate");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cylinder_serialNumber_key" ON "Cylinder"("serialNumber");

-- CreateIndex
CREATE INDEX "Otp_email_idx" ON "Otp"("email");

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Bill_billStartDate_billEndDate_idx" ON "Bill"("billStartDate", "billEndDate");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_customerId_billStartDate_billEndDate_key" ON "Bill"("customerId", "billStartDate", "billEndDate");

-- CreateIndex
CREATE INDEX "Payment_paidOn_idx" ON "Payment"("paidOn");

-- CreateIndex
CREATE INDEX "PaymentLog_performedAt_idx" ON "PaymentLog"("performedAt");

-- CreateIndex
CREATE INDEX "PaymentLog_eventType_idx" ON "PaymentLog"("eventType");

-- CreateIndex
CREATE INDEX "PaymentLog_customerCode_idx" ON "PaymentLog"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNote_noteDate_key" ON "DailyNote"("noteDate");

-- CreateIndex
CREATE INDEX "Backup_backupDate_idx" ON "Backup"("backupDate");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "Restore_restoreDate_idx" ON "Restore"("restoreDate");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_module_idx" ON "ActivityLog"("module");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminAccessCode_code_key" ON "SuperAdminAccessCode"("code");

-- CreateIndex
CREATE INDEX "SuperAdminAccessCode_code_idx" ON "SuperAdminAccessCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_billId_key" ON "Invoice"("billId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_billId_idx" ON "Invoice"("billId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Cylinder" ADD CONSTRAINT "Cylinder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CylinderTransaction" ADD CONSTRAINT "CylinderTransaction_cylinderId_fkey" FOREIGN KEY ("cylinderId") REFERENCES "Cylinder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CylinderTransaction" ADD CONSTRAINT "CylinderTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CylinderTransaction" ADD CONSTRAINT "CylinderTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
