import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all cylinder entries...");
  
  const result = await prisma.cylinderEntry.deleteMany({});
  
  console.log(`Successfully deleted ${result.count} cylinder entry records.`);
}

main()
  .catch((e) => {
    console.error("Error deleting cylinder entries:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
