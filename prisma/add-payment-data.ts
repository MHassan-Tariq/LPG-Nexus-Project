import { PrismaClient, BillStatus } from "@prisma/client";
import { addDays, subDays, startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Adding dummy payment records...");

  // Get all customers
  const customers = await prisma.customer.findMany({
    select: { id: true, customerCode: true, name: true },
  });

  if (customers.length === 0) {
    console.log("No customers found. Please seed customers first.");
    return;
  }

  // Generate bills for the last 3 months and current month
  const months = [3, 2, 1, 0]; // Last 3 months and current month

  for (const monthOffset of months) {
    const targetDate = subDays(new Date(), monthOffset * 30);
    const billStart = startOfMonth(targetDate);
    const billEnd = endOfMonth(targetDate);

    for (const customer of customers.slice(0, Math.min(customers.length, 10))) {
      // Check if bill already exists for this period
      const existing = await prisma.bill.findFirst({
        where: {
          customerId: customer.id,
          billStartDate: billStart,
          billEndDate: billEnd,
        },
      });

      if (existing) {
        console.log(`Bill already exists for ${customer.name} - ${monthOffset} months ago`);
        continue;
      }

      const lastMonthRemaining = randomBetween(0, 5) * 500;
      const currentMonthBill = randomBetween(12, 22) * 1000;
      const cylinders = randomBetween(4, 12);
      const total = lastMonthRemaining + currentMonthBill;

      // Random payment status
      const paymentStatus = Math.random();
      let paidAmount = 0;
      let paymentCount = 0;

      if (paymentStatus > 0.6) {
        // Fully paid
        paidAmount = total;
        paymentCount = 1;
      } else if (paymentStatus > 0.3) {
        // Partially paid
        paidAmount = randomBetween(2000, total - 1000);
        paymentCount = Math.random() > 0.5 ? 2 : 1;
      }
      // else: not paid (paidAmount stays 0)

      // Create bill first
      const bill = await prisma.bill.create({
        data: {
          customerId: customer.id,
          billStartDate: billStart,
          billEndDate: billEnd,
          lastMonthRemaining,
          currentMonthBill,
          cylinders,
          status: paidAmount === 0 ? BillStatus.NOT_PAID : paidAmount >= total ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
        },
      });

      // Create payments if any
      if (paidAmount > 0) {
        if (paymentCount === 1) {
          await prisma.payment.create({
            data: {
              billId: bill.id,
              amount: paidAmount,
              paidOn: addDays(billStart, randomBetween(10, 25)),
              method: paymentStatus > 0.7 ? "bank_transfer" : "cash",
              notes: paidAmount >= total ? "Full payment received" : "Partial payment",
            },
          });
        } else if (paymentCount === 2) {
          await prisma.payment.createMany({
            data: [
              {
                billId: bill.id,
                amount: Math.floor(paidAmount / 2),
                paidOn: addDays(billStart, randomBetween(10, 15)),
                method: "cash",
                notes: "First installment",
              },
              {
                billId: bill.id,
                amount: paidAmount - Math.floor(paidAmount / 2),
                paidOn: addDays(billStart, randomBetween(20, 25)),
                method: "bank_transfer",
                notes: "Second installment",
              },
            ],
          });
        }
      }

      console.log(`Created bill for ${customer.name} - ${monthOffset} months ago (${bill.id})`);
    }
  }

  console.log("Dummy payment records added successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

