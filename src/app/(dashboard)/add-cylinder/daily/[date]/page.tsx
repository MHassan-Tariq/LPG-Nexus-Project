import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DailyRecordsClient } from "@/components/add-cylinder/daily-records-client";
import { format, parseISO } from "date-fns";

interface DailyRecordsPageProps {
  params: { date: string };
  searchParams: { customer?: string };
}

export default async function DailyRecordsPage({ params, searchParams }: DailyRecordsPageProps) {
  // Parse the date from URL (format: yyyy-MM-dd)
  let deliveryDate: Date;
  try {
    deliveryDate = parseISO(params.date);
    if (isNaN(deliveryDate.getTime())) {
      notFound();
    }
  } catch {
    notFound();
  }

  // Get start and end of the day
  const startOfDay = new Date(deliveryDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(deliveryDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Build where clause - filter by date and optionally by customer
  const where: any = {
    deliveryDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  // If customer filter is provided, filter by customer name
  if (searchParams.customer) {
    const customerFilter = decodeURIComponent(searchParams.customer);
    // Handle both formats: "3 · Ijaz" and "Ijaz"
    if (customerFilter.includes(" · ")) {
      const customerNameOnly = customerFilter.split(" · ")[1];
      // Match by full format or name only
      where.customerName = {
        contains: customerNameOnly,
        mode: "insensitive",
      };
    } else {
      where.customerName = {
        contains: customerFilter,
        mode: "insensitive",
      };
    }
  }

  // Fetch cylinder entries for this date (and customer if specified)
  const entries = await prisma.cylinderEntry.findMany({
    where,
    orderBy: [
      { deliveryDate: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Transform entries to match CylinderEntryRow format
  const transformedEntries = entries.map((entry) => ({
    id: entry.id,
    billCreatedBy: entry.billCreatedBy,
    cylinderType: entry.cylinderType as "DELIVERED" | "RECEIVED",
    cylinderLabel: entry.cylinderLabel,
    deliveredBy: entry.deliveredBy,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    amount: entry.amount,
    customerName: entry.customerName,
    verified: entry.verified,
    description: entry.description,
    deliveryDate: entry.deliveryDate,
    paymentType: entry.paymentType,
    paymentAmount: entry.paymentAmount,
    paymentReceivedBy: entry.paymentReceivedBy,
    emptyCylinderReceived: entry.emptyCylinderReceived,
    customerId: entry.customerId,
  }));

  // Get customer name for display
  const customerName = searchParams.customer ? decodeURIComponent(searchParams.customer) : null;
  const displayCustomerName = customerName && customerName.includes(" · ") 
    ? customerName.split(" · ")[1] 
    : customerName;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <DailyRecordsClient 
            entries={transformedEntries} 
            date={deliveryDate}
            customerName={displayCustomerName}
          />
        </main>
      </div>
    </div>
  );
}
