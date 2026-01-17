import type { CustomerFormValues } from "@/components/add-customer/customer-drawer";
import { CustomerSummary } from "@/components/add-customer/customer-summary";
import { CustomerTable } from "@/components/add-customer/customer-table";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import { customerSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];

async function createCustomer(values: CustomerFormValues) {
  "use server";

  try {
    const parsed = customerSchema.parse({
      ...values,
      status: values.status ?? "ACTIVE",
    });

    const normalizedContacts =
      parsed.additionalContacts?.map((contact) => ({
        name: contact.name.trim(),
        contactNumber: contact.contactNumber.trim(),
      })).filter((contact) => contact.name && contact.contactNumber) ?? [];
    const contactNumber = normalizedContacts[0]?.contactNumber || parsed.contactNumber;

    if (!contactNumber) {
      throw new Error("At least one contact number is required. Please add a contact person with a contact number.");
    }

    const adminId = await getTenantIdForCreate();
    await prisma.customer.create({
      data: {
        name: parsed.name,
        contactNumber,
        customerType: parsed.customerType,
        cylinderType: parsed.cylinderType,
        billType: parsed.billType,
        securityDeposit: parsed.securityDeposit ?? 0,
        area: parsed.area,
        city: parsed.city,
        country: parsed.country,
        address: parsed.address,
        notes: parsed.notes ?? null,
        additionalContacts: normalizedContacts,
        status: parsed.status ?? "ACTIVE",
        email: parsed.email && parsed.email.trim() !== "" ? parsed.email.trim() : null,
        adminId,
      },
    });

    revalidatePath("/add-customer");
  } catch (error: any) {
    console.error("Error creating customer:", error);
    throw new Error(error?.message || "Failed to create customer. Please check all required fields and try again.");
  }
}

interface AddCustomerPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function AddCustomerPage({ searchParams }: AddCustomerPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/add-customer");
  const requestedSize = searchParams.pageSize;
  
  // Handle "all" option or numeric page size
  let pageSize: number;
  if (requestedSize === "all") {
    pageSize = 10000; // Large number to show all records
  } else {
    const numericSize = Number(requestedSize) || DEFAULT_PAGE_SIZE;
    const validSizes = PAGE_SIZE_OPTIONS.filter((size): size is number => typeof size === "number");
    pageSize = validSizes.includes(numericSize) ? numericSize : DEFAULT_PAGE_SIZE;
  }
  
  const query = searchParams.q?.trim() ?? "";
  const tenantFilter = await getTenantFilter();

  const numericQuery = Number(query);
  const where = {
    ...tenantFilter,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            ...(Number.isNaN(numericQuery) ? [] : [{ customerCode: numericQuery }]),
          ],
        }
      : {}),
  };

  const totalCount = await prisma.customer.count({ where });
  let totalPages = 1;
  let page = Math.max(Number(searchParams.page) || 1, 1);
  
  if (requestedSize !== "all") {
    totalPages = Math.ceil(totalCount / pageSize) || 1;
  } else {
    page = 1;
  }
  
  // Ensure page is within valid range
  const validPage = requestedSize === "all" ? 1 : Math.min(Math.max(page, 1), totalPages);
  
  // Redirect if page is out of bounds (only if user requested invalid page)
  if (page !== validPage && totalPages > 0 && page > totalPages) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
      params.set("page", String(validPage));
      if (requestedSize && requestedSize !== "all") params.set("pageSize", String(pageSize));
    redirect(`/add-customer?${params.toString()}`);
  }
  
  const [customers, totalCustomers, activeCustomers, inactiveCustomers] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { customerCode: "asc" },
      skip: requestedSize === "all" ? 0 : (validPage - 1) * pageSize,
      take: requestedSize === "all" ? 10000 : pageSize,
        select: {
          id: true,
          customerCode: true,
          name: true,
          contactNumber: true,
          customerType: true,
          cylinderType: true,
          billType: true,
          address: true,
          status: true,
        },
      }),
      prisma.customer.count({ where: tenantFilter }),
      prisma.customer.count({ where: { ...tenantFilter, status: "ACTIVE" } }),
      prisma.customer.count({ where: { ...tenantFilter, status: "INACTIVE" } }),
    ]);
  // Calculate next customer code: use count + 1 for continuous sequential numbering
  // This ensures new customers get the next sequential number (1, 2, 3, 4...)
  const nextCustomerCode = totalCustomers + 1;

  const customerStats = {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <CustomerSummary stats={customerStats} />
          <CustomerTable
            customers={customers}
            query={query}
            page={validPage}
            totalPages={totalPages}
            pageSize={requestedSize === "all" ? "all" : pageSize}
            onCreateCustomer={createCustomer}
            nextCustomerCode={nextCustomerCode}
          />
        </main>
      </div>
    </div>
  );
}

