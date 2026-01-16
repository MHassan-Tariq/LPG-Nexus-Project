import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "lpgnexus1@gmail.com";
  const newPassword = "SuperAdmin@2024";
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    console.error(`User with email ${email} not found!`);
    process.exit(1);
  }

  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      passwordHash: passwordHash,
    },
  });

  console.log("\n✅ Successfully reset super admin password!");
  console.log("\n📋 Super Admin Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Username:    ${updatedUser.username || "lpgnexus1"}`);
  console.log(`Password:    ${newPassword}`);
  console.log(`Email:       ${updatedUser.email}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("⚠️  IMPORTANT: Please change this password after first login!\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
