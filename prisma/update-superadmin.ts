import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "lpgnexus1@gmail.com";
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    console.error(`User with email ${email} not found!`);
    process.exit(1);
  }

  // Generate a default password if user doesn't have one
  const defaultPassword = "SuperAdmin@2024";
  const passwordHash = existingUser.passwordHash || await bcrypt.hash(defaultPassword, 10);

  // Generate username if not exists (use email prefix or "superadmin")
  const username = existingUser.username || email.split("@")[0] || "superadmin";

  // Update user to SUPER_ADMIN
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      role: UserRole.SUPER_ADMIN,
      passwordHash: passwordHash,
      username: username,
      status: "ACTIVE",
      isVerified: true,
    },
  });

  console.log("\n✅ Successfully updated user to SUPER_ADMIN!");
  console.log("\n📋 Super Admin Account Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Name:        ${updatedUser.name}`);
  console.log(`Email:       ${updatedUser.email}`);
  console.log(`Username:    ${updatedUser.username || "superadmin"}`);
  console.log(`Password:    ${existingUser.passwordHash ? "(existing password)" : defaultPassword}`);
  console.log(`Phone:       ${updatedUser.phone || "N/A"}`);
  console.log(`Business:    ${updatedUser.businessName || "N/A"}`);
  console.log(`Role:        ${updatedUser.role}`);
  console.log(`Status:      ${updatedUser.status}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!existingUser.passwordHash) {
    console.log(`⚠️  IMPORTANT: Default password has been set: ${defaultPassword}`);
    console.log("   Please change this password after first login!\n");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
