import { PrismaClient, CylinderStatus, ExpenseCategory, TransactionType } from "@prisma/client";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@cylinders.io" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@cylinders.io",
      phone: "+1-202-555-0123",
      role: "ADMIN",
    },
  });

  const customerSeeds = [
    {
      name: "Apex Industries",
      contactNumber: "03001112233",
      email: "sales@apex.com",
      customerType: "Corporate",
      cylinderType: "45kg (Commercial cylinder)",
      billType: "Credit",
      securityDeposit: 80000,
      area: "Industrial Estate",
      city: "Lahore",
      country: "Pakistan",
      notes: "Priority delivery account",
      additionalContacts: [
        { name: "Umair Tariq", contactNumber: "03001110000" },
        { name: "Client Support", contactNumber: "03112223344" },
      ],
      emptyCylinders: 3,
      status: "ACTIVE",
      address: "180 Market Street, Lahore",
    },
    {
      name: "Nova Hospitals",
      contactNumber: "03457788991",
      email: "procurement@novahospitals.com",
      customerType: "Healthcare",
      cylinderType: "35kg (Business cylinder)",
      billType: "Monthly",
      securityDeposit: 60000,
      area: "Canal Bank",
      city: "Islamabad",
      country: "Pakistan",
      notes: "Requires medical grade checks",
      additionalContacts: [{ name: "Dr. Saad", contactNumber: "03227770000" }],
      emptyCylinders: 4,
      status: "ACTIVE",
      address: "181 Canal Bank Road, Islamabad",
    },
    {
      name: "Beacon Labs",
      contactNumber: "03334455667",
      email: "ops@beaconlabs.com",
      customerType: "Research",
      cylinderType: "12kg (Domestic cylinder)",
      billType: "Cash",
      securityDeposit: 25000,
      area: "University Avenue",
      city: "Karachi",
      country: "Pakistan",
      notes: "Inactive account",
      additionalContacts: [],
      emptyCylinders: 1,
      status: "INACTIVE",
      address: "182 University Avenue, Karachi",
    },
  ];

  const customers = await prisma.$transaction(
    customerSeeds.map((seed) =>
      prisma.customer.upsert({
        where: { email: seed.email ?? `${seed.name.toLowerCase().replace(/\s+/g, "")}@example.com` },
        update: {},
        create: seed,
      }),
    ),
  );

  const cylinders = await prisma.$transaction(
    new Array(12).fill(null).map((_, idx) =>
      prisma.cylinder.upsert({
        where: { serialNumber: `CYL-${20200 + idx}` },
        update: {},
        create: {
          serialNumber: `CYL-${20200 + idx}`,
          gasType: idx % 3 === 0 ? "LPG" : idx % 3 === 1 ? "Oxygen" : "Nitrogen",
          capacityLiters: idx % 3 === 0 ? 14 : idx % 3 === 1 ? 45 : 18,
          status:
            idx % 4 === 0
              ? CylinderStatus.IN_STOCK
              : idx % 4 === 1
                ? CylinderStatus.ASSIGNED
                : idx % 4 === 2
                  ? CylinderStatus.MAINTENANCE
                  : CylinderStatus.RETIRED,
          location: idx % 4 === 3 ? "Warehouse B" : "Warehouse A",
          pressurePsi: 120 + idx * 2,
          lastInspection: subDays(new Date(), 30 + idx),
          nextInspection: addDays(new Date(), 60 - idx),
          customerId: idx % 4 === 1 ? customers[idx % customers.length].id : null,
          notes:
            idx % 3 === 0
              ? "Priority shipment ready."
              : idx % 3 === 1
                ? "Reserved for hospital usage."
                : "Scheduled for inspection cycle.",
        },
      }),
    ),
  );

  const transactions = await prisma.$transaction(
    cylinders.slice(0, 8).map((cylinder, idx) =>
      prisma.cylinderTransaction.create({
        data: {
          cylinderId: cylinder.id,
          customerId: idx % customers.length === 0 ? customers[0].id : customers[1].id,
          userId: admin.id,
          type: idx % 2 === 0 ? TransactionType.ISSUE : TransactionType.RETURN,
          quantity: 1,
          recordedAt: subDays(new Date(), idx * 4),
          notes: idx % 2 === 0 ? "Scheduled delivery" : "Routine return inspection",
        },
      }),
    ),
  );

  await prisma.cylinderEntry.createMany({
    data: [
      {
        billCreatedBy: "operations@lpgnexus.com",
        cylinderType: "DELIVERED",
        cylinderLabel: "12kg Domestic",
        deliveredBy: "Imran",
        amount: 1500,
        customerName: "Ahmed Khan",
        customerId: "12kg Cylinder",
        verified: true,
        description: "12kg Cylinder delivery",
        deliveryDate: subDays(new Date(), 1),
      },
      {
        billCreatedBy: "billing@lpgnexus.com",
        cylinderType: "RECEIVED",
        cylinderLabel: "45kg Commercial",
        deliveredBy: "Khalil",
        amount: 1500,
        customerName: "Fatima Ali",
        customerId: "45kg Commercial",
        verified: false,
        description: "45kg commercial cylinder return",
        deliveryDate: subDays(new Date(), 2),
      },
      {
        billCreatedBy: "finance@lpgnexus.com",
        cylinderType: "DELIVERED",
        cylinderLabel: "Industrial CO2",
        deliveredBy: "Amir",
        amount: 2200,
        customerName: "Hassan Ahmed",
        customerId: "Industrial CO2",
        verified: true,
        description: "Industrial CO2 batch",
        deliveryDate: subDays(new Date(), 3),
      },
    ],
  });

  const expenseSeeds = [
    {
      id: "expense-transportation",
      expenseType: "Transportation",
      amount: 5000,
      category: ExpenseCategory.HOME,
      expenseDate: new Date("2025-11-15"),
      description: "Delivery vehicle fuel",
    },
    {
      id: "expense-maintenance",
      expenseType: "Maintenance",
      amount: 3500,
      category: ExpenseCategory.OTHER,
      expenseDate: new Date("2025-11-14"),
      description: "Cylinder valve replacement",
    },
    {
      id: "expense-utilities",
      expenseType: "Utilities",
      amount: 2000,
      category: ExpenseCategory.HOME,
      expenseDate: new Date("2025-11-13"),
      description: "Electricity bill",
    },
    {
      id: "expense-marketing",
      expenseType: "Marketing",
      amount: 4200,
      category: ExpenseCategory.OTHER,
      expenseDate: new Date("2025-11-12"),
      description: "Local awareness campaign",
    },
    {
      id: "expense-rent",
      expenseType: "Warehouse Rent",
      amount: 8000,
      category: ExpenseCategory.HOME,
      expenseDate: new Date("2025-11-10"),
      description: "Monthly storage rental",
    },
  ];

  await prisma.expense.createMany({
    data: expenseSeeds,
    skipDuplicates: true,
  });

  await prisma.otp.create({
    data: {
      email: "admin@cylinders.io",
      code: "123456",
      expiresAt: addDays(new Date(), 1),
    },
  });

  console.info(
    `Seeded ${customers.length} customers, ${cylinders.length} cylinders, ${transactions.length} movements.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

