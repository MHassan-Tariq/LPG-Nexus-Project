import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmptyCylindersData() {
  try {
    console.log("Checking for emptyCylinders data in database...\n");

    // Try to query the column directly using raw SQL
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count 
      FROM "Customer" 
      WHERE "emptyCylinders" IS NOT NULL;
    `);

    const count = Number(result[0]?.count || 0);
    
    if (count > 0) {
      console.log(`✅ Found ${count} customers with emptyCylinders data!`);
      console.log("\nData is SAFE in the database.");
      console.log("\nTo restore the field in the schema, add this line to Customer model:");
      console.log('  emptyCylinders     Int                   @default(0)');
    } else {
      // Column might not exist or all values are NULL
      try {
        const sampleData = await prisma.$queryRawUnsafe<Array<{ emptyCylinders: number | null }>>(`
          SELECT "emptyCylinders" 
          FROM "Customer" 
          LIMIT 5;
        `);
        console.log("✅ Column exists! Sample data:", sampleData);
      } catch (error: any) {
        if (error.message.includes('column "emptyCylinders" does not exist')) {
          console.log("❌ Column 'emptyCylinders' does NOT exist in database.");
          console.log("⚠️  The data has been lost - column was already dropped.");
        } else {
          console.log("⚠️  Error checking column:", error.message);
        }
      }
    }

    // Show all customers with their emptyCylinders values
    try {
      const customers = await prisma.$queryRawUnsafe<Array<{ customerCode: number; name: string; emptyCylinders: number | null }>>(`
        SELECT "customerCode", "name", "emptyCylinders" 
        FROM "Customer" 
        ORDER BY "customerCode" 
        LIMIT 10;
      `);
      
      console.log("\n📊 Sample customer data:");
      customers.forEach((c) => {
        console.log(`  Customer ${c.customerCode} (${c.name}): emptyCylinders = ${c.emptyCylinders ?? 'NULL'}`);
      });
    } catch (error: any) {
      console.log("\n⚠️  Could not retrieve customer data:", error.message);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes('column "emptyCylinders" does not exist')) {
      console.log("\n⚠️  IMPORTANT: The column has been removed from the database!");
      console.log("   This means your data was lost when you ran 'prisma db push' or a migration.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyCylindersData();
