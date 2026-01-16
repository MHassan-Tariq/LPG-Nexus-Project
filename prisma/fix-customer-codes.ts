import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fix customer codes to match the correct sequence:
 * ID 1: Arham
 * ID 2: Arbaz Yousaf
 * ID 3: Faizan Ali
 * ID 4: Ijaz
 * ID 5: Muhammad Saim
 * ID 6: Hafiz Usman
 * ID 7: Ali
 * 
 * Strategy:
 * 1. Move all existing customers to temporary high codes (90000+)
 * 2. Update correct customers to their target codes
 * 3. Delete customers not in the correct list (only if no relations)
 * 4. Reset sequence so next ID is 8
 */
async function fixCustomerCodes() {
  try {
    console.log("🔧 Starting customer code fix...\n");

    // Define the correct customer sequence
    const correctCustomers = [
      { code: 1, name: "Arham" },
      { code: 2, name: "Arbaz Yousaf" },
      { code: 3, name: "Faizan Ali" },
      { code: 4, name: "Ijaz" },
      { code: 5, name: "Muhammad Saim" },
      { code: 6, name: "Hafiz Usman" },
      { code: 7, name: "Ali" },
    ];

    const correctNamesLower = correctCustomers.map((c) => c.name.toLowerCase());

    await prisma.$transaction(async (tx) => {
      // Step 1: Get all existing customers
      const allCustomers = await tx.customer.findMany({
        select: { id: true, customerCode: true, name: true },
      });
      console.log(`📊 Found ${allCustomers.length} existing customers\n`);

      // Step 2: Move ALL customers to temporary codes (90000+)
      // This avoids conflicts when reassigning codes
      let tempCode = 90000;
      for (const customer of allCustomers) {
        if (customer.customerCode < 90000) {
          await tx.customer.update({
            where: { id: customer.id },
            data: { customerCode: tempCode++ },
          });
        }
      }
      console.log("✅ Moved all customers to temporary codes\n");

      // Step 3: Find and update correct customers to their target codes
      tempCode = 90000; // Reset temp counter
      for (const correctCustomer of correctCustomers) {
        // Find customer by name (case-insensitive)
        const existing = allCustomers.find(
          (c) => c.name.toLowerCase() === correctCustomer.name.toLowerCase()
        );

        if (existing) {
          // Update to correct code
          await tx.customer.update({
            where: { id: existing.id },
            data: { customerCode: correctCustomer.code },
          });
          console.log(`✅ Updated: ${correctCustomer.name} → Code ${correctCustomer.code}`);
        } else {
          console.log(`⚠️  Customer "${correctCustomer.name}" not found in database`);
          console.log(`   You may need to create this customer manually with code ${correctCustomer.code}\n`);
        }
      }
      console.log("");

      // Step 4: Delete customers not in the correct list (only if no relations)
      const customersToCheck = allCustomers.filter(
        (c) => !correctNamesLower.includes(c.name.toLowerCase())
      );

      for (const customer of customersToCheck) {
        // Check for related records
        const [hasBills, hasCylinders, hasTransactions, hasEntries] = await Promise.all([
          tx.bill.count({ where: { customerId: customer.id } }),
          tx.cylinder.count({ where: { customerId: customer.id } }),
          tx.cylinderTransaction.count({ where: { customerId: customer.id } }),
          tx.cylinderEntry.count({ where: { customerId: customer.id } }),
        ]);

        const hasRelations = hasBills > 0 || hasCylinders > 0 || hasTransactions > 0 || hasEntries > 0;

        if (hasRelations) {
          console.log(
            `⚠️  Cannot delete "${customer.name}" (current code: ${customer.customerCode}) - has related records:`
          );
          if (hasBills > 0) console.log(`     - ${hasBills} bill(s)`);
          if (hasCylinders > 0) console.log(`     - ${hasCylinders} cylinder(s)`);
          if (hasTransactions > 0) console.log(`     - ${hasTransactions} transaction(s)`);
          if (hasEntries > 0) console.log(`     - ${hasEntries} cylinder entry(ies)`);
          console.log(`   This customer will remain with a temporary code (90000+)\n`);
        } else {
          await tx.customer.delete({ where: { id: customer.id } });
          console.log(`🗑️  Deleted customer: "${customer.name}" (code ${customer.customerCode})\n`);
        }
      }

      // Step 5: Reset the customer code sequence in PostgreSQL
      // Set sequence to max code (7) so next auto-increment is 8
      const maxCode = Math.max(...correctCustomers.map((c) => c.code));
      
      try {
        await tx.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"Customer"', 'customerCode'), ${maxCode}, true);`
        );
        console.log(`✅ Reset customer code sequence. Next new customer will get code: ${maxCode + 1}\n`);
      } catch (seqError: any) {
        console.log(`⚠️  Could not reset sequence automatically: ${seqError.message}`);
        console.log(`   You may need to reset it manually in your database\n`);
      }
    });

    console.log("✅ Customer code fix completed!\n");

    // Verify results
    const finalCustomers = await prisma.customer.findMany({
      orderBy: { customerCode: "asc" },
      select: { customerCode: true, name: true },
    });

    console.log("📋 Final customer list:");
    console.log("─".repeat(50));
    finalCustomers.forEach((c) => {
      const isCorrect = c.customerCode >= 1 && c.customerCode <= 7;
      const marker = isCorrect ? "✅" : "⚠️ ";
      console.log(`${marker} Code ${String(c.customerCode).padStart(5)}: ${c.name}`);
    });
    console.log("─".repeat(50));
    console.log(`\nTotal customers: ${finalCustomers.length}`);
    
    const correctCount = finalCustomers.filter((c) => c.customerCode >= 1 && c.customerCode <= 7).length;
    console.log(`Correct sequence (1-7): ${correctCount}`);
    console.log(`Other customers: ${finalCustomers.length - correctCount}`);
  } catch (error) {
    console.error("\n❌ Error fixing customer codes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCustomerCodes()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
