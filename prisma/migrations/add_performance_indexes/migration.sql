-- Add performance indexes for frequently queried fields
-- This migration adds indexes to improve query performance

-- Cylinder indexes
CREATE INDEX IF NOT EXISTS "Cylinder_status_idx" ON "Cylinder"("status");
CREATE INDEX IF NOT EXISTS "Cylinder_customerId_idx" ON "Cylinder"("customerId");
CREATE INDEX IF NOT EXISTS "Cylinder_createdAt_idx" ON "Cylinder"("createdAt");

-- CylinderTransaction indexes
CREATE INDEX IF NOT EXISTS "CylinderTransaction_recordedAt_idx" ON "CylinderTransaction"("recordedAt");
CREATE INDEX IF NOT EXISTS "CylinderTransaction_type_idx" ON "CylinderTransaction"("type");
CREATE INDEX IF NOT EXISTS "CylinderTransaction_customerId_idx" ON "CylinderTransaction"("customerId");
CREATE INDEX IF NOT EXISTS "CylinderTransaction_cylinderId_idx" ON "CylinderTransaction"("cylinderId");

-- Customer indexes
CREATE INDEX IF NOT EXISTS "Customer_customerCode_idx" ON "Customer"("customerCode");
CREATE INDEX IF NOT EXISTS "Customer_status_idx" ON "Customer"("status");
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");

