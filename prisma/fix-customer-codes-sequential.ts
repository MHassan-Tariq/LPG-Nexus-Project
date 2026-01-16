import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing customer codes to be sequential (1, 2, 3, 4...)...\n");

  try {
    // Get all customers ordered by their current customerCode
    const customers = await prisma.customer.findMany({
      orderBy: { customerCode: "asc" },
      select: {
        id: true,
        customerCode: true,
        name: true,
      },
    });

    console.log(`Found ${customers.length} customers to update.\n`);

    if (customers.length === 0) {
      console.log("No customers found. Nothing to update.");
      return;
    }

    // Update each customer with sequential codes starting from 1
    for (let i = 0; i < customers.length; i++) {
      const newCode = i + 1;
      const customer = customers[i];

      if (customer.customerCode !== newCode) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { customerCode: newCode },
        });
        console.log(`✓ Updated "${customer.name}" (old: ${customer.customerCode}, new: ${newCode})`);
      } else {
        console.log(`✓ "${customer.name}" already has correct code: ${newCode}`);
      }
    }

    // Reset the database sequence to continue from the next number
    const totalCustomers = customers.length;
    const nextSequenceValue = totalCustomers + 1;

    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Customer"', 'customerCode'), ${nextSequenceValue}, false);`
    );

    console.log(`\n✓ Database sequence reset to start from ${nextSequenceValue}`);
    console.log(`\n✅ Successfully updated all customer codes to be sequential!`);
    console.log(`   Next new customer will get code: ${nextSequenceValue}`);
  } catch (error) {
    console.error("Error fixing customer codes:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
