/**
 * Add Cylinder Page
 * 
 * IMPORTANT: Payment Design Principle
 * ====================================
 * 
 * PAYMENT ENTRY: ONLY from /payments page
 * PAYMENT VISIBILITY: Everywhere (read-only)
 * 
 * This page should:
 * - Show payment information (read-only)
 * - Display remaining amounts (computed from Bill + Payment tables)
 * - NOT allow creating/editing/deleting payments
 * 
 * Note: CylinderEntry.paymentAmount is for operational tracking (when cylinders are received),
 *       NOT for financial bill payments. Financial payments use Bill + Payment tables.
 * 
 * See: docs/PAYMENT_DESIGN_PRINCIPLES.md for full design documentation.
 */

import { CylinderFormValues } from "@/components/add-cylinder/cylinder-form";
import { AddCylinderWrapper } from "@/components/add-cylinder/add-cylinder-wrapper";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { enforcePagePermission } from "@/lib/permission-check";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parse, getMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { PagePermissionWrapper } from "@/components/permissions/page-permission-wrapper";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

async function createCylinderEntry(values: CylinderFormValues) {
  "use server";

  try {
    // Check edit permission using core utility
    const { requireEditPermissionForAction } = await import("@/core/permissions/permission-guards");
    const permissionError = await requireEditPermissionForAction("addCylinder");
    if (permissionError) {
      return permissionError;
    }
    // For RECEIVED type: use emptyCylinderReceived as quantity, otherwise use quantity
    let quantity = values.cylinderType === "RECEIVED" 
      ? (values.emptyCylinderReceived ?? 0)
      : (values.quantity ?? 0);

    // Calculate total amount only for DELIVERED type
    const totalAmount = values.cylinderType === "DELIVERED" && values.unitPrice && values.quantity
      ? values.unitPrice * values.quantity
      : values.amount ?? 0;

    // Extract customer ID from customerName (format: "4 · Arham" or just "Arham")
    let customerId: string | null = null;
    let customerNameOnly = values.customerName;
    if (values.customerName) {
      // Check if customerName contains " · " (customer code separator)
      if (values.customerName.includes(" · ")) {
        const customerCode = parseInt(values.customerName.split(" · ")[0]);
        customerNameOnly = values.customerName.split(" · ")[1];
        // Find customer by code and name (with tenant filter)
        const tenantFilter = await getTenantFilter();
        const customer = await prisma.customer.findFirst({
          where: {
            ...tenantFilter,
            customerCode: customerCode,
            name: customerNameOnly,
          },
          select: { id: true },
        });
        customerId = customer?.id || null;
      } else {
        // If no separator, try to find by name only (with tenant filter)
        const tenantFilter = await getTenantFilter();
        const customer = await prisma.customer.findFirst({
          where: {
            ...tenantFilter,
            name: values.customerName,
          },
          select: { id: true },
        });
        customerId = customer?.id || null;
      }
    }

    // Validate RECEIVED entries: cannot receive more than delivered for the specific unitPrice
    if (values.cylinderType === "RECEIVED" && values.emptyCylinderReceived && values.unitPrice) {
      // Match by date, customer, cylinderLabel, AND unitPrice
      // Calculate total delivered for this customer with the same cylinderLabel and unitPrice
      // Use flexible matching - check both formats (full format and name only)
      const deliveryDate = values.deliveryDate ? new Date(values.deliveryDate) : new Date();
      const dateKey = format(deliveryDate, "yyyy-MM-dd");
      const startOfDay = new Date(dateKey);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateKey);
      endOfDay.setHours(23, 59, 59, 999);

      const tenantFilter = await getTenantFilter();
      const totalDelivered = await prisma.cylinderEntry.aggregate({
        where: {
          ...tenantFilter,
          cylinderType: "DELIVERED",
          cylinderLabel: values.cylinderLabel,
          unitPrice: values.unitPrice,
          deliveryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          OR: [
            { customerName: values.customerName }, // Full format "1 · Arham"
            { customerName: customerNameOnly }, // Just "Arham"
          ],
        },
        _sum: {
          quantity: true,
        },
      });

      // Calculate total received for this customer with the same cylinderLabel and unitPrice
      const totalReceived = await prisma.cylinderEntry.aggregate({
        where: {
          ...tenantFilter,
          cylinderType: "RECEIVED",
          cylinderLabel: values.cylinderLabel,
          unitPrice: values.unitPrice,
          deliveryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          OR: [
            { customerName: values.customerName }, // Full format "1 · Arham"
            { customerName: customerNameOnly }, // Just "Arham"
          ],
        },
        _sum: {
          quantity: true,
        },
      });

      const deliveredQty = totalDelivered._sum.quantity ?? 0;
      const receivedQty = totalReceived._sum.quantity ?? 0;
      const newReceivedQty = values.emptyCylinderReceived;
      const totalAfterThisEntry = receivedQty + newReceivedQty;

      if (deliveredQty === 0) {
        return {
          success: false,
          error: `No delivered cylinders found for ${values.cylinderLabel} at Rs ${values.unitPrice.toLocaleString()} on this date.`,
        };
      }

      if (totalAfterThisEntry > deliveredQty) {
        return {
          success: false,
          error: `Cannot receive ${newReceivedQty} cylinders. Total received (${totalAfterThisEntry}) cannot exceed total delivered (${deliveredQty}) for ${values.cylinderLabel} at Rs ${values.unitPrice.toLocaleString()}.`,
        };
      }
    }

    // Ensure quantity is valid for RECEIVED entries
    if (values.cylinderType === "RECEIVED") {
      if (!values.emptyCylinderReceived || values.emptyCylinderReceived <= 0) {
        return {
          success: false,
          error: "Empty cylinder received quantity must be greater than 0.",
        };
      }
      // Ensure quantity matches emptyCylinderReceived for RECEIVED entries
      if (quantity !== values.emptyCylinderReceived) {
        quantity = values.emptyCylinderReceived;
      }
    }

    // Ensure quantity is valid for DELIVERED entries
    if (values.cylinderType === "DELIVERED" && (!quantity || quantity <= 0)) {
      return {
        success: false,
        error: "Cylinder quantity must be greater than 0.",
      };
    }

    console.log("Creating cylinder entry with data:", {
      cylinderType: values.cylinderType,
      quantity,
      emptyCylinderReceived: values.emptyCylinderReceived,
      customerName: values.customerName,
      customerId,
    });

    try {
      const adminId = await getTenantIdForCreate();
      const createdEntry = await prisma.cylinderEntry.create({
        data: {
          billCreatedBy: values.billCreatedBy,
          cylinderType: values.cylinderType,
          cylinderLabel: values.cylinderLabel,
          deliveredBy: values.deliveredBy || null,
          unitPrice: values.unitPrice ?? 0,
          quantity: quantity,
          amount: totalAmount,
          customerName: values.customerName,
          customerId: customerId,
          verified: values.verified,
          description: values.description || null,
          deliveryDate: values.deliveryDate,
          // RECEIVED type fields - convert empty strings to null
          paymentType: values.paymentType || null,
          paymentAmount: values.paymentAmount && values.paymentAmount > 0 ? values.paymentAmount : null,
          paymentReceivedBy: values.paymentReceivedBy && values.paymentReceivedBy.trim() ? values.paymentReceivedBy : null,
          emptyCylinderReceived: values.emptyCylinderReceived && values.emptyCylinderReceived > 0 ? values.emptyCylinderReceived : null,
          adminId,
        },
      });

      console.log("Cylinder entry created successfully:", {
        id: createdEntry.id,
        cylinderType: createdEntry.cylinderType,
        quantity: createdEntry.quantity,
        customerName: createdEntry.customerName,
      });

      revalidatePath("/add-cylinder");
      
      // Auto-sync bills for this customer when DELIVERED entry is created
      if (values.cylinderType === "DELIVERED") {
        const { autoSyncBillsForCustomer } = await import("@/lib/auto-bill-sync");
        await autoSyncBillsForCustomer(customerId, values.deliveryDate, values.customerName);
      }
      
      // Return the created entry ID so we can redirect to the download page
      return { success: true, id: createdEntry.id };
    } catch (createError: any) {
      console.error("Database error creating cylinder entry:", createError);
      throw createError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error("Error creating cylinder entry:", error);
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    if (error?.code === "P2002") {
      return { success: false, error: "A cylinder entry with this data already exists." };
    }
    
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : "Failed to create cylinder entry. Please try again."
    };
  }
}

interface AddCylinderPageProps {
  searchParams: Record<string, string | undefined>;
}

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];

export default async function AddCylinderPage({ searchParams }: AddCylinderPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/add-cylinder");
  
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
  
  // If "all" is selected, show all records without pagination
  let page = 1;
  let totalPages = 1;
  let skip = 0;
  let take = pageSize;
  
  if (requestedSize !== "all") {
    page = Math.max(Number(searchParams.page) || 1, 1);
  }
  const query = searchParams.q?.trim() ?? "";
  const period = searchParams.period ?? "all";
  const cylinderType = searchParams.type ?? "all";
  
  // Get month/year filters from URL (same logic as dashboard)
  const month = searchParams.month;
  const year = searchParams.year;
  
  // Determine filter type
  const shouldFilterByDate = month && month !== "ALL" && year && year !== "ALL";
  const shouldFilterByMonthOnly = month && month !== "ALL" && (!year || year === "ALL");
  const shouldFilterByYearOnly = (!month || month === "ALL") && year && year !== "ALL";
  
  // Build date filter for deliveryDate
  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
  if (shouldFilterByDate) {
    const dateStr = `${year}-${month}-01`;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    if (!Number.isNaN(parsed.getTime())) {
      dateFilter = {
        gte: startOfMonth(parsed),
        lte: endOfMonth(parsed),
      };
    }
  } else if (shouldFilterByYearOnly && year) {
    const yearNumber = parseInt(year);
    if (!isNaN(yearNumber)) {
      dateFilter = {
        gte: startOfYear(new Date(yearNumber, 0, 1)),
        lte: endOfYear(new Date(yearNumber, 11, 31)),
      };
    }
  }

  const periodFilter = (() => {
    if (period === "last") {
      const start = startOfMonth(subMonths(new Date(), 1));
      const end = startOfMonth(new Date());
      return { gte: start, lt: end };
    }
    if (period === "quarter") {
      const start = startOfMonth(subMonths(new Date(), 2));
      return { gte: start };
    }
    if (period === "all") return undefined;
    // Default to "current" - show current month's records
    if (period === "current") {
      const start = startOfMonth(new Date());
      return { gte: start };
    }
    // Fallback to current month if period is something else
    const start = startOfMonth(new Date());
    return { gte: start };
  })();

  // Build the where clause for filtering
  const where: any = {};
  
  // Apply cylinder type filter (DELIVERED, RECEIVED, or all)
  // NOTE: For RECEIVED filter, we need to fetch BOTH DELIVERED and RECEIVED entries
  // so the client can match RECEIVED entries to their corresponding DELIVERED entries
  if (cylinderType && cylinderType !== "all" && cylinderType !== "RECEIVED") {
    // For DELIVERED filter, explicitly filter by DELIVERED type
    where.cylinderType = cylinderType;
  }
  // For "all" filter, don't add cylinderType to where clause - show all types
  // For RECEIVED filter, don't add cylinderType to where clause - fetch all types
  // Client-side will filter to show only DELIVERED entries that have matching RECEIVED entries
  
  // Only show records if a customer is selected (query exists)
  // If no customer is selected, show empty table (only summary will be visible)
  if (query) {
    // The query is in format "1 · Arham" (with middle dot)
    // Try to match the customer name - use contains to handle any variations
    // Extract just the customer name part if it contains " · "
    if (query.includes(" · ")) {
      const customerNameOnly = query.split(" · ")[1].trim();
      // Try matching by the name part only (more flexible)
      where.customerName = {
        contains: customerNameOnly,
        mode: "insensitive",
      };
    } else {
      // If no separator, use the query as-is
      where.customerName = {
        contains: query.trim(),
        mode: "insensitive",
      };
    }
  } else {
    // When no customer is selected, don't show any records in main table
    // Only the Customer Cylinder Summary will be visible
    // Use a condition that will never match to return empty results
    where.id = { equals: "impossible-id-that-will-never-exist-12345" };
  }

  // Calculate pagination values
  // Since client-side aggregation reduces the number of rows,
  // we need to fetch more entries to ensure we have enough for the requested pageSize
  // Multiply by 3 to account for aggregation (entries with same date/customer/label/price get combined)
  if (requestedSize !== "all") {
    // For client-side pagination after aggregation, fetch more entries
    // This ensures we have enough aggregated rows for the requested pageSize
    const fetchMultiplier = 3; // Fetch 3x to account for aggregation
    take = pageSize * fetchMultiplier;
    skip = 0; // Don't skip - we'll paginate after aggregation on client side
  } else {
    skip = 0;
    take = 10000; // Large number to get all records
  }

  // Apply date filter (month/year) or period filter to where clause
  // Month/year filter takes precedence over period filter
  if (dateFilter) {
    where.deliveryDate = dateFilter;
  } else if (periodFilter) {
    where.deliveryDate = periodFilter;
  }

  const tenantFilter = await getTenantFilter();
  
  // For RECEIVED filter or "all" filter, we need to fetch both DELIVERED and RECEIVED entries
  // so the client can match RECEIVED entries to DELIVERED entries
  // Build where clause - if RECEIVED or "all" filter, exclude cylinderType from where
  const entriesWhere = (cylinderType === "RECEIVED" || cylinderType === "all")
    ? (() => {
        const { cylinderType: _, ...whereWithoutType } = where;
        return {
          ...tenantFilter,
          ...whereWithoutType, // Exclude cylinderType to fetch both types
        };
      })()
    : {
        ...tenantFilter,
        ...where, // For DELIVERED filter, include cylinderType filter
      };
  
  // For month-only filtering, we need to fetch all entries and filter in JS
  // For year-only or month+year, use Prisma date filter
  const entriesWhereForQuery = shouldFilterByMonthOnly
    ? (() => {
        // Remove deliveryDate filter for month-only, we'll filter in JS
        const { deliveryDate: _, ...whereWithoutDate } = entriesWhere;
        return whereWithoutDate;
      })()
    : entriesWhere;

  const [
    entries,
    totalEntries,
    latestEntry,
    customersForSelect,
    allCylinderEntries, // Get all entries for customer summary (with same filters)
  ] = await Promise.all([
    prisma.cylinderEntry.findMany({
      where: entriesWhereForQuery,
      orderBy: [
        { deliveryDate: "desc" },
        { createdAt: "desc" }, // Secondary sort by creation time (latest first) for same-date entries
      ],
      skip: shouldFilterByMonthOnly ? 0 : skip, // Don't skip for month-only, we'll paginate after filtering
      take: shouldFilterByMonthOnly ? 10000 : take, // Fetch all for month-only, we'll filter in JS
    }),
    prisma.cylinderEntry.count({ where: entriesWhere }),
    prisma.cylinderEntry.findFirst({
      where: tenantFilter,
      orderBy: [
        { deliveryDate: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.customer.findMany({
      where: tenantFilter,
      orderBy: { customerCode: "asc" },
      select: {
        id: true,
        customerCode: true,
        name: true,
      },
    }),
    prisma.cylinderEntry.findMany({
      // Apply the same filters as the main table (period + customer)
      // BUT do NOT apply type filter - summary should show totals for both DELIVERED and RECEIVED
      // This ensures summary shows complete totals regardless of table filter
      where: (() => {
        const summaryWhere: any = {
          ...tenantFilter, // CRITICAL: Apply tenant filter for data isolation
        };
        // Apply date filter (month/year) or period filter if it exists
        // Month/year filter takes precedence over period filter
        if (dateFilter) {
          summaryWhere.deliveryDate = dateFilter;
        } else if (periodFilter) {
          summaryWhere.deliveryDate = periodFilter;
        }
        // Apply customer filter if query exists (same logic as main table)
        if (query) {
          if (query.includes(" · ")) {
            const customerNameOnly = query.split(" · ")[1].trim();
            summaryWhere.customerName = {
              contains: customerNameOnly,
              mode: "insensitive",
            };
          } else {
            summaryWhere.customerName = {
              contains: query.trim(),
              mode: "insensitive",
            };
          }
        }
        return summaryWhere;
      })(),
      select: {
        customerId: true,
        customerName: true,
        cylinderType: true,
        cylinderLabel: true,
        quantity: true,
        emptyCylinderReceived: true, // For RECEIVED entries, use this if available
        amount: true, // Include amount for total calculation
      },
    }),
  ]);

  // Calculate customer cylinder summaries
  const customerSummariesMap = new Map<
    string,
    {
      customerId: string | null;
      customerName: string;
      customerCode: number | null;
      totalDelivered: number;
      totalReceived: number;
      totalAmount: number;
      cylinderLabels: Set<string>; // Track all cylinder types for this customer
    }
  >();

  // Process all entries to calculate summaries
  for (const entry of allCylinderEntries) {
    // Parse customerName to extract code and name
    let customerCode: number | null = null;
    let customerNameOnly = entry.customerName;
    
    if (entry.customerName.includes(" · ")) {
      // Format: "1 · Arham"
      const parts = entry.customerName.split(" · ");
      const code = parseInt(parts[0]);
      if (!isNaN(code)) {
        customerCode = code;
        customerNameOnly = parts[1] || entry.customerName;
      }
    }
    
    // Use customerCode if available, otherwise try to find from customers list
    if (customerCode === null) {
      const customer = customersForSelect.find((c) => c.name === customerNameOnly);
      customerCode = customer?.customerCode ?? null;
    }
    
    const key = customerNameOnly; // Use just the name as the key
    
    if (!customerSummariesMap.has(key)) {
      customerSummariesMap.set(key, {
        customerId: entry.customerId,
        customerName: customerNameOnly, // Store just the name
        customerCode: customerCode,
        totalDelivered: 0,
        totalReceived: 0,
        totalAmount: 0,
        cylinderLabels: new Set<string>(),
      });
    }

    const summary = customerSummariesMap.get(key)!;
    if (entry.cylinderType === "DELIVERED") {
      summary.totalDelivered += entry.quantity;
      summary.totalAmount += entry.amount || 0;
    } else if (entry.cylinderType === "RECEIVED") {
      // For RECEIVED entries, use emptyCylinderReceived if available, otherwise use quantity
      const receivedQty = entry.emptyCylinderReceived ?? entry.quantity;
      summary.totalReceived += receivedQty;
    }
    
    // Track cylinder label if available
    if (entry.cylinderLabel) {
      summary.cylinderLabels.add(entry.cylinderLabel);
    }
  }

  // Convert to array and calculate remaining
  let customerSummaries = Array.from(customerSummariesMap.values()).map((summary) => ({
    ...summary,
    remaining: summary.totalDelivered - summary.totalReceived,
    cylinderType: Array.from(summary.cylinderLabels).join(", ") || "—", // Join all cylinder types
  }));
  
  // Filter customer summaries to show only selected customer when query exists
  if (query) {
    // Extract customer name from query (format: "1 · Arham" -> extract "Arham")
    let customerNameToMatch = query;
    if (query.includes(" · ")) {
      customerNameToMatch = query.split(" · ")[1].trim();
    }
    // Filter to show only the selected customer
    customerSummaries = customerSummaries.filter(
      (summary) => summary.customerName.trim() === customerNameToMatch
    );
  }

  // Note: totalPages calculation is now done client-side based on aggregated entries
  // Since aggregation happens client-side, we can't accurately calculate totalPages server-side
  // The client will calculate the correct totalPages based on aggregated rows
  if (requestedSize !== "all") {
    // Approximate totalPages (will be recalculated client-side after aggregation)
    totalPages = Math.ceil(totalEntries / pageSize) || 1;
    if (page > totalPages && totalPages > 0) {
      page = totalPages;
    }
  } else {
    totalPages = 1; // Show "1 of 1" when all records are displayed
  }
  
  const displayPageSize: number | string = requestedSize === "all" ? "all" : pageSize;

  // Type cast entries to match CylinderEntryRow type
  const typedEntries = entries.map((entry) => ({
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
  }));

  return (
    <PagePermissionWrapper pathname="/add-cylinder">
      <>
        <Card className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Last updated record</p>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-slate-900">
                  {latestEntry ? `${latestEntry.customerName}` : "No records yet"}
                </h3>
                {latestEntry && (
                  <Badge
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      latestEntry.cylinderType === "DELIVERED"
                        ? "border-[#d4e6ff] bg-[#edf4ff] text-[#2554d8] hover:bg-[#edf4ff] hover:text-[#2554d8]"
                        : "border-[#d9e5ff] bg-[#f0f4ff] text-[#1c5bff] hover:bg-[#f0f4ff] hover:text-[#1c5bff]",
                    )}
                  >
                    {latestEntry.cylinderType === "DELIVERED" ? "Delivered" : "Received"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {latestEntry
                  ? format(latestEntry.deliveryDate ?? latestEntry.createdAt, "MMMM d, yyyy")
                  : "Create your first cylinder record to see updates here."}
              </p>
            </div>
            {latestEntry && (
              <Badge className="rounded-full bg-[#eef3ff] px-4 py-2 text-[#2544d6] hover:bg-[#eef3ff] hover:text-[#2544d6]">
                {Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
                  latestEntry.amount,
                )}
              </Badge>
            )}
          </div>
        </Card>

        <AddCylinderWrapper
          entries={typedEntries}
          query={query}
          period={period}
          page={page}
          totalPages={totalPages}
          pageSize={displayPageSize}
          customers={customersForSelect}
          customerSummaries={customerSummaries}
          onCreateSubmit={createCylinderEntry}
        />
      </>
    </PagePermissionWrapper>
  );
}

