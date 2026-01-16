import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "lpgnexus1@gmail.com";
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      status: true,
      isVerified: true,
    },
  });

  if (!user) {
    console.error(`User with email ${email} not found!`);
    process.exit(1);
  }

  console.log("\n📋 User Account Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Name:        ${user.name}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Username:    ${user.username || "N/A"}`);
  console.log(`Role:        ${user.role}`);
  console.log(`Status:      ${user.status}`);
  console.log(`Verified:    ${user.isVerified ? "Yes ✓" : "No ✗"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (user.role !== "SUPER_ADMIN") {
    console.log("⚠️  WARNING: User role is NOT SUPER_ADMIN!");
    console.log(`   Current role: ${user.role}`);
    console.log("\n   To fix this, run:");
    console.log("   npm run db:update-superadmin\n");
  } else {
    console.log("✅ User has SUPER_ADMIN role correctly set!\n");
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

