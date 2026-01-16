import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllCylinderEntries() {
  try {
    console.log("Deleting all cylinder entries...");
    
    const result = await prisma.cylinderEntry.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} cylinder entries.`);
    
    return result.count;
  } catch (error) {
    console.error("❌ Error deleting cylinder entries:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllCylinderEntries()
  .then((count) => {
    console.log(`\n✨ Done! Deleted ${count} entries.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed to delete entries:", error);
    process.exit(1);
  });

