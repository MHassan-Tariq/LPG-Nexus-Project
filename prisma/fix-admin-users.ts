/**
 * Fix ADMIN Users: Ensure all ADMIN users have adminId = their own id
 * 
 * This script ensures that all ADMIN users have their adminId set to their own id
 * (self-reference), which is required for multi-tenant functionality.
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing ADMIN users adminId...");

  // Get all ADMIN users
  const adminUsers = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true, adminId: true, email: true, name: true },
  });

  console.log(`Found ${adminUsers.length} ADMIN user(s)`);

  // Update ADMIN users to have adminId = their own id
  let updated = 0;
  for (const user of adminUsers) {
    if (user.adminId !== user.id) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { adminId: user.id },
        });
        updated++;
        console.log(`✓ Updated ${user.name} (${user.email}) - adminId set to ${user.id}`);
      } catch (e: any) {
        console.error(`✗ Error updating user ${user.id}:`, e.message);
      }
    } else {
      console.log(`✓ ${user.name} (${user.email}) already has correct adminId`);
    }
  }

  console.log(`\n✅ Updated ${updated} ADMIN user(s)`);
  console.log("Done! Users may need to log out and log back in to get updated JWT.");
}

main()
  .catch((e) => {
    console.error("Error fixing ADMIN users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

