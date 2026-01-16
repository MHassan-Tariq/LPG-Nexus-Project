import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "lpgnexus1";
  
  const user = await prisma.user.findUnique({
    where: { username },
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
    console.log(`User with username "${username}" not found!`);
    return;
  }

  console.log("\n📋 User Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Name:        ${user.name}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Username:    ${user.username}`);
  console.log(`Role:        ${user.role}`);
  console.log(`Status:      ${user.status}`);
  console.log(`isVerified:  ${user.isVerified}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!user.isVerified) {
    console.log("⚠️  User is NOT verified. Updating now...\n");
    
    const updated = await prisma.user.update({
      where: { username },
      data: {
        isVerified: true,
        status: "ACTIVE",
      },
    });
    
    console.log("✅ User has been verified!");
    console.log(`   isVerified: ${updated.isVerified}`);
    console.log(`   Status: ${updated.status}\n`);
  } else {
    console.log("✅ User is already verified!\n");
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
