import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all SUPER_ADMIN users
  const superAdmins = await prisma.user.findMany({
    where: {
      role: "SUPER_ADMIN",
    },
  });

  if (superAdmins.length === 0) {
    console.log("No SUPER_ADMIN users found in the database.");
    return;
  }

  console.log(`Found ${superAdmins.length} SUPER_ADMIN user(s):`);

  // Verify all super admin users
  for (const superAdmin of superAdmins) {
    const updatedUser = await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        isVerified: true,
        status: "ACTIVE",
      },
    });

    console.log(`✓ Verified SUPER_ADMIN: ${updatedUser.email}`);
    console.log(`  - Name: ${updatedUser.name}`);
    console.log(`  - Username: ${updatedUser.username || "N/A"}`);
    console.log(`  - isVerified: ${updatedUser.isVerified}`);
    console.log(`  - Status: ${updatedUser.status}`);
    console.log("");
  }

  console.log("All SUPER_ADMIN users have been verified successfully!");
}

main()
  .catch((e) => {
    console.error("Error verifying super admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
