import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { InvoiceManagementPage } from "@/components/payments/invoice-management-page";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

export default async function InvoicesPage({ searchParams }: { searchParams: { customer?: string } }) {
  // Check permissions before rendering
  await enforcePagePermission("/payments");

  // Get customer filter from query params
  const customerFilter = searchParams?.customer;
  const tenantFilter = await getTenantFilter();

  // Fetch all bills with invoice data and payments (with tenant filter)
  const bills = await prisma.bill.findMany({
    where: {
      ...tenantFilter,
      ...(customerFilter
        ? {
            customer: {
              name: {
                equals: customerFilter,
                mode: "insensitive",
              },
            },
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, customerCode: true, name: true } },
      invoice: { select: { id: true, invoiceNumber: true, generatedAt: true } },
      payments: { select: { amount: true } },
    },
    orderBy: [{ billStartDate: "desc" }, { createdAt: "desc" }],
  });

  // Fetch cylinder entries for all bills
  const billsWithEntries = await Promise.all(
    bills.map(async (bill) => {
      // Fetch all DELIVERED cylinder entries for this customer in the bill period (with tenant filter)
      const cylinderEntries = await prisma.cylinderEntry.findMany({
        where: {
          ...tenantFilter,
          customerId: bill.customer.id,
          cylinderType: "DELIVERED",
          deliveryDate: {
            gte: bill.billStartDate,
            lte: bill.billEndDate,
          },
        },
        select: {
          id: true,
          deliveryDate: true,
          cylinderLabel: true,
          quantity: true,
          unitPrice: true,
          amount: true,
          deliveredBy: true,
          billCreatedBy: true,
          description: true,
        },
        orderBy: {
          deliveryDate: "asc",
        },
      });

      const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
      const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      return {
        id: bill.id,
        code: String(bill.customer.customerCode),
        name: bill.customer.name,
        billStartDate: bill.billStartDate,
        billEndDate: bill.billEndDate,
        totalAmount,
        paidAmount,
        remainingAmount,
        lastMonthRemaining: bill.lastMonthRemaining,
        currentMonthBill: bill.currentMonthBill,
        cylinders: bill.cylinders,
        cylinderEntries,
        invoice: bill.invoice
          ? {
              id: bill.invoice.id,
              invoiceNumber: bill.invoice.invoiceNumber,
              generatedAt: bill.invoice.generatedAt,
            }
          : null,
      };
    })
  );

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="rounded-[24px] border border-transparent px-1">
            <h1 className="text-2xl font-semibold text-slate-900">Invoice Manager</h1>
            <p className="text-sm text-slate-500">Generate, download, or delete invoices for bills</p>
          </div>

          <InvoiceManagementPage bills={billsWithEntries} initialCustomerFilter={customerFilter || undefined} />
        </main>
      </div>
    </div>
  );
}
