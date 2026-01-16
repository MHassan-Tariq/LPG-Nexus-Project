import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Starting database reset...\n");

  try {
    // Delete all data in correct order (respecting foreign key constraints)
    console.log("Deleting all data from tables...");

    // Delete records that have foreign keys first
    await prisma.paymentLog.deleteMany();
    console.log("✓ Deleted PaymentLog records");

    await prisma.payment.deleteMany();
    console.log("✓ Deleted Payment records");

    await prisma.invoice.deleteMany();
    console.log("✓ Deleted Invoice records");

    await prisma.bill.deleteMany();
    console.log("✓ Deleted Bill records");

    await prisma.cylinderTransaction.deleteMany();
    console.log("✓ Deleted CylinderTransaction records");

    await prisma.cylinderEntry.deleteMany();
    console.log("✓ Deleted CylinderEntry records");

    await prisma.expense.deleteMany();
    console.log("✓ Deleted Expense records");

    await prisma.inventoryItem.deleteMany();
    console.log("✓ Deleted InventoryItem records");

    await prisma.cylinder.deleteMany();
    console.log("✓ Deleted Cylinder records");

    await prisma.customer.deleteMany();
    console.log("✓ Deleted Customer records");

    await prisma.activityLog.deleteMany();
    console.log("✓ Deleted ActivityLog records");

    await prisma.dailyNote.deleteMany();
    console.log("✓ Deleted DailyNote records");

    await prisma.backup.deleteMany();
    console.log("✓ Deleted Backup records");

    await prisma.restore.deleteMany();
    console.log("✓ Deleted Restore records");

    await prisma.systemSettings.deleteMany();
    console.log("✓ Deleted SystemSettings records");

    await prisma.otp.deleteMany();
    console.log("✓ Deleted OTP records");

    await prisma.superAdminAccessCode.deleteMany();
    console.log("✓ Deleted SuperAdminAccessCode records");

    // Delete all users last (but we'll create super admin after)
    await prisma.user.deleteMany();
    console.log("✓ Deleted User records");

    console.log("\n✅ All data deleted successfully!\n");

    // Create super admin account
    console.log("👤 Creating super admin account...\n");

    const email = "lpgnexus1@gmail.com";
    const username = "lpgnexus1";
    const password = "SuperAdmin@2024";

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: email,
        username: username,
        passwordHash: passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
    });

    console.log("✅ Super admin account created successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 SUPER ADMIN LOGIN CREDENTIALS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Email:       ${superAdmin.email}`);
    console.log(`   Username:    ${superAdmin.username}`);
    console.log(`   Password:    ${password}`);
    console.log(`   Role:        ${superAdmin.role}`);
    console.log(`   Status:      ${superAdmin.status}`);
    console.log(`   Verified:    ${superAdmin.isVerified ? "Yes ✓" : "No ✗"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🔐 You can now login with these credentials!\n");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.code === "P2003") {
      console.error("Foreign key constraint error. Please check table dependencies.");
    }
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
