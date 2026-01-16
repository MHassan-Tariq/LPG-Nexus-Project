/**
 * Data Migration Script: Populate adminId for existing records
 * 
 * This script assigns all existing tenant-scoped records to the first ADMIN user.
 * If no ADMIN user exists, it creates one.
 * 
 * Run this AFTER adding adminId as nullable column but BEFORE making it required.
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting adminId population...");

  // Find or create the first ADMIN user
  let adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { id: true, email: true, name: true },
  });

  if (!adminUser) {
    console.log("No ADMIN user found. Creating default admin...");
    adminUser = await prisma.user.create({
      data: {
        name: "Default Admin",
        email: "admin@lpgnexus.com",
        role: UserRole.ADMIN,
        status: "ACTIVE",
        isVerified: true,
        // Set adminId to self (ADMIN users own their tenant)
        adminId: undefined, // Will be set after creation
      },
      select: { id: true, email: true, name: true },
    });

    // Update adminId to self-reference
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { adminId: adminUser.id },
    });

    console.log(`Created default admin: ${adminUser.email} (${adminUser.id})`);
  }

  // Ensure all ADMIN users have adminId = their own ID (self-reference)
  const allAdmins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  for (const admin of allAdmins) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { adminId: admin.id }, // Self-reference for ADMIN users
    });
  }

  console.log(`Updated ${allAdmins.length} ADMIN user(s) with self-referencing adminId`);
  console.log(`Using first admin for data assignment: ${adminUser.email} (${adminUser.id})`);

  const adminId = adminUser.id;
  console.log(`Assigning all records to admin: ${adminId}`);

  // Populate adminId for all tenant-scoped models
  const updates = await Promise.all([
    prisma.customer.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.cylinder.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.cylinderEntry.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.expense.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.inventoryItem.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.bill.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.payment.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.paymentLog.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.dailyNote.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.backup.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.restore.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
    prisma.invoice.updateMany({
      where: { adminId: null },
      data: { adminId },
    }),
  ]);

  console.log("Updated records:");
  console.log(`  Customers: ${updates[0].count}`);
  console.log(`  Cylinders: ${updates[1].count}`);
  console.log(`  Cylinder Entries: ${updates[2].count}`);
  console.log(`  Expenses: ${updates[3].count}`);
  console.log(`  Inventory Items: ${updates[4].count}`);
  console.log(`  Bills: ${updates[5].count}`);
  console.log(`  Payments: ${updates[6].count}`);
  console.log(`  Payment Logs: ${updates[7].count}`);
  console.log(`  Daily Notes: ${updates[8].count}`);
  console.log(`  Backups: ${updates[9].count}`);
  console.log(`  Restores: ${updates[10].count}`);
  console.log(`  Invoices: ${updates[11].count}`);

  console.log("\n✅ adminId population completed!");
}

main()
  .catch((e) => {
    console.error("Error populating adminId:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

