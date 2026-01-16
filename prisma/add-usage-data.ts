import { PrismaClient, TransactionType } from "@prisma/client";
import { subMonths, startOfMonth, endOfMonth, addDays, format } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding dummy usage data for the last few months...");

  // Get existing cylinders and customers
  const [cylinders, customers, users] = await Promise.all([
    prisma.cylinder.findMany({ take: 20 }),
    prisma.customer.findMany({ take: 10 }),
    prisma.user.findMany({ take: 1 }),
  ]);

  if (cylinders.length === 0) {
    console.log("❌ No cylinders found. Please run the seed script first: npm run db:seed");
    return;
  }

  if (customers.length === 0) {
    console.log("❌ No customers found. Please run the seed script first: npm run db:seed");
    return;
  }

  const userId = users.length > 0 ? users[0].id : null;

  // Generate transactions for the last 6 months
  const transactions = [];
  const now = new Date();

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = startOfMonth(subMonths(now, monthOffset));
    const monthEnd = endOfMonth(monthStart);

    // Generate varying number of transactions per month (more recent = more transactions)
    const baseTransactions = 8 - monthOffset; // 8 for current month, 7 for previous, etc.
    const transactionsPerMonth = baseTransactions + Math.floor(Math.random() * 10);

    for (let i = 0; i < transactionsPerMonth; i++) {
      // Random date within the month
      const daysInMonth = Math.floor(
        (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const randomDay = Math.floor(Math.random() * daysInMonth);
      const recordedAt = addDays(monthStart, randomDay);

      // Random cylinder and customer
      const cylinder = cylinders[Math.floor(Math.random() * cylinders.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];

      transactions.push({
        cylinderId: cylinder.id,
        customerId: customer.id,
        userId: userId,
        type: TransactionType.ISSUE, // Chart only shows ISSUE transactions
        quantity: 1 + Math.floor(Math.random() * 4), // 1-4 cylinders per transaction
        recordedAt: recordedAt,
        notes: `Usage transaction - ${format(recordedAt, "MMMM yyyy")}`,
      });
    }

    console.log(
      `  📅 Month ${monthOffset + 1} (${format(monthStart, "MMM yyyy")}): ${transactionsPerMonth} transactions`,
    );
  }

  console.log(`\n📊 Creating ${transactions.length} transactions in total...`);

  // Create transactions in batches
  const batchSize = 50;
  let created = 0;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    try {
      await prisma.cylinderTransaction.createMany({
        data: batch,
        skipDuplicates: false,
      });
      created += batch.length;
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(transactions.length / batchSize);
      console.log(`  ✅ Batch ${batchNum}/${totalBatches}: Created ${batch.length} transactions`);
    } catch (error: any) {
      console.warn(`  ⚠️  Batch ${Math.floor(i / batchSize) + 1} had errors (may be duplicates):`, error.message);
    }
  }

  console.log(`\n✨ Successfully added ${created} dummy transactions!`);
  console.log(`📈 Your Cylinder Usage Trend chart should now show data for the last 6 months.`);
}

main()
  .catch((error) => {
    console.error("❌ Failed to add usage data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

