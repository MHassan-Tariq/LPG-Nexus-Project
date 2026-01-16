"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, getMonth } from "date-fns";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Download, Check, X, Loader2 } from "lucide-react";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteCylinderEntry } from "@/app/add-cylinder/actions";
import { usePageFilters } from "@/hooks/use-page-filters";

import { formatNumber, formatCurrency } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

function truncateDescription(text: string | null | undefined, maxChars: number = 15): string {
  if (!text) return "—";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
}

// Parse cylinderLabel to extract weight and type
function parseCylinderLabel(label: string | null | undefined): { weight: string; type: string } {
  if (!label) return { weight: "—", type: "—" };
  
  // Format: "12kg (Domestic cylinder)"
  const match = label.match(/^(\d+kg)\s*\((.+)\)$/);
  if (match) {
    return { weight: match[1], type: match[2] };
  }
  
  // Fallback: try to extract just the weight part
  const weightMatch = label.match(/^(\d+kg)/);
  if (weightMatch) {
    return { weight: weightMatch[1], type: label.replace(weightMatch[1], "").trim().replace(/^[()]*|[()]*$/g, "") || "—" };
  }
  
  return { weight: label, type: "—" };
}

export interface CylinderEntryRow {
  id: string;
  billCreatedBy: string;
  cylinderType: "DELIVERED" | "RECEIVED";
  cylinderLabel?: string | null;
  deliveredBy?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  customerName: string;
  verified: boolean;
  description?: string | null;
  deliveryDate: Date;
  createdAt?: Date; // Creation timestamp for sorting same-date entries
  // RECEIVED type fields
  paymentType?: string | null;
  paymentAmount?: number | null;
  paymentReceivedBy?: string | null;
  emptyCylinderReceived?: number | null;
}

interface CustomerCylinderSummaryData {
  customerId: string | null;
  customerName: string;
  customerCode: number | null;
  totalDelivered: number;
  totalReceived: number;
  remaining: number;
  totalAmount?: number; // Total amount for this customer (optional)
  cylinderType?: string; // Cylinder type(s) for this customer
}

interface CylinderTableProps {
  entries: CylinderEntryRow[];
  query: string;
  period: string;
  page: number;
  totalPages: number;
  pageSize: number | string;
  preserveParams?: Record<string, string | undefined>;
  onView?: (entry: CylinderEntryRow) => void;
  onEdit?: (entry: CylinderEntryRow) => void;
  canEdit?: boolean;
  customers?: Array<{ id: string; customerCode: number; name: string }>;
  customerSummaries?: CustomerCylinderSummaryData[];
}

function buildCylinderParams(
  nextPage: number,
  query: string,
  period: string,
  pageSize: number | string,
  preserveParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(preserveParams ?? {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (query) params.set("q", query);
  if (period) params.set("period", period);
  params.set("page", String(nextPage));
  params.set("pageSize", String(pageSize));
  return `/add-cylinder?${params.toString()}#top`;
}

export function CylinderTable({ entries, query, period, page, totalPages, pageSize: initialPageSize, preserveParams, onView, onEdit, customers = [], canEdit = true, customerSummaries = [] }: CylinderTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Use hook for month/year filters
  const { selectedMonth, selectedYear, setMonth, setYear, filterType } = usePageFilters();
  const { shouldFilterByMonthOnly } = filterType;
  
  // Period filter removed - using month/year filters instead
  // Always use "all" (All Types) - filter removed per user request
  const selectedCylinderType = "all";
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(initialPageSize);

  function formatCustomerLabel(customer: { customerCode: number; name: string }) {
    return `${customer.customerCode} · ${customer.name}`;
  }

  // Filter entries by month if month-only filter is active
  let filteredEntries = entries;
  if (shouldFilterByMonthOnly && selectedMonth && selectedMonth !== "ALL") {
    const selectedMonthNumber = parseInt(selectedMonth) - 1; // Convert "01" to 0 (January), etc.
    filteredEntries = entries.filter((entry) => {
      if (!entry.deliveryDate) return false;
      const entryMonth = getMonth(entry.deliveryDate);
      return entryMonth === selectedMonthNumber;
    });
  }

  const totalQuantity = filteredEntries.reduce((sum, entry) => sum + (entry.quantity ?? 0), 0);
  const emptyCylinderCount = filteredEntries.reduce(
    (sum, entry) => sum + (entry.cylinderType === "RECEIVED" ? entry.quantity ?? 0 : 0),
    0,
  );
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Group entries by date and customer for highlighting
  function getGroupKey(entry: CylinderEntryRow): string {
    const dateKey = entry.deliveryDate ? format(entry.deliveryDate, "yyyy-MM-dd") : "no-date";
    return `${dateKey}-${entry.customerName}`;
  }

  // Get a key for matching RECEIVED entries to DELIVERED entries (includes cylinderLabel AND unitPrice)
  // RECEIVED entries must match DELIVERED entries with same date/customer/label/price
  function getReceivedMatchKey(entry: CylinderEntryRow): string {
    const dateKey = entry.deliveryDate ? format(entry.deliveryDate, "yyyy-MM-dd") : "no-date";
    const cylinderLabel = entry.cylinderLabel || "";
    const unitPrice = entry.unitPrice ?? 0;
    return `${dateKey}-${entry.customerName}-${cylinderLabel}-${unitPrice}`;
  }

  // Get a key for aggregating DELIVERED entries (includes cylinderLabel AND unitPrice)
  // Different unitPrice = different row, same unitPrice = aggregate
  function getDeliveredAggregateKey(entry: CylinderEntryRow): string {
    const dateKey = entry.deliveryDate ? format(entry.deliveryDate, "yyyy-MM-dd") : "no-date";
    const cylinderLabel = entry.cylinderLabel || "";
    const unitPrice = entry.unitPrice ?? 0;
    return `${dateKey}-${entry.customerName}-${cylinderLabel}-${unitPrice}`;
  }

  // Determine if an entry is part of a group (has same date and customer as another entry)
  const groupKeys = filteredEntries.map(getGroupKey);
  const groupCounts = groupKeys.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Aggregate RECEIVED entries by date/customer/cylinderLabel/unitPrice (sum quantities)
  // RECEIVED entries must match specific DELIVERED entries with same price
  const receivedDataByGroup = new Map<string, {
    emptyCylinderReceived: number;
    quantity: number;
    cylinderWeight: string;
    cylinderType: string;
    verified: boolean;
    description: string | null;
    deliveredBy: string | null;
    paymentAmount: number;
    paymentType: string | null;
    paymentReceivedBy: string | null;
  }>();
  
  filteredEntries.forEach((entry) => {
    if (entry.cylinderType === "RECEIVED") {
      const matchKey = getReceivedMatchKey(entry);
      const parsed = parseCylinderLabel(entry.cylinderLabel);
      const existing = receivedDataByGroup.get(matchKey);
      
      if (existing) {
        // Sum quantities and payment amounts if entry already exists
        existing.emptyCylinderReceived += (entry.emptyCylinderReceived ?? 0);
        existing.quantity += (entry.quantity ?? 0);
        existing.paymentAmount += (entry.paymentAmount ?? 0);
        // If any entry is CASH, mark as CASH (otherwise keep existing or set to CREDIT)
        if (entry.paymentType === "CASH") {
          existing.paymentType = "CASH";
          // For CASH payments, use the paymentReceivedBy from the entry
          if (entry.paymentReceivedBy) {
            existing.paymentReceivedBy = entry.paymentReceivedBy;
          }
        } else if (!existing.paymentType && entry.paymentType) {
          existing.paymentType = entry.paymentType;
        }
      } else {
        // Create new entry
        receivedDataByGroup.set(matchKey, {
          emptyCylinderReceived: entry.emptyCylinderReceived ?? 0,
          quantity: entry.quantity ?? 0,
          cylinderWeight: parsed.weight,
          cylinderType: parsed.type,
          verified: entry.verified,
          description: entry.description ?? null,
          deliveredBy: entry.deliveredBy ?? null,
          paymentAmount: entry.paymentAmount ?? 0,
          paymentType: entry.paymentType ?? null,
          paymentReceivedBy: entry.paymentReceivedBy ?? null,
        });
      }
    }
  });

  // Aggregate DELIVERED entries by date/customer/cylinderLabel/unitPrice (sum quantities and amounts)
  // Different unitPrice = different row, same unitPrice = aggregate into same row
  const aggregatedDeliveredEntries = new Map<string, CylinderEntryRow>();
  
  filteredEntries.forEach((entry) => {
    if (entry.cylinderType === "DELIVERED") {
      const aggregateKey = getDeliveredAggregateKey(entry); // Includes unitPrice
      const existing = aggregatedDeliveredEntries.get(aggregateKey);
      
      if (existing) {
        // Same date/customer/label/price → aggregate (sum quantities and amounts)
        existing.quantity += (entry.quantity ?? 0);
        existing.amount += (entry.amount ?? 0);
        // unitPrice stays the same (it's part of the key, so entries with same price are aggregated)
        // Keep first entry's ID and other metadata for view/edit purposes
      } else {
        // Different price (or first entry) → create new aggregated entry
        aggregatedDeliveredEntries.set(aggregateKey, {
          ...entry,
          quantity: entry.quantity ?? 0,
          amount: entry.amount ?? 0,
        });
      }
    }
  });

  // Helper function to calculate filtered entries count
  // Since selectedCylinderType is always "all", we always return the total count
  function getFilteredEntriesCount(): number {
    return aggregatedDeliveredEntries.size;
  }

  // Create a map to assign alternating background colors to groups
  const groupColors = new Map<string, string>();
  let colorIndex = 0;
  const colors = ["bg-blue-50/50", "bg-green-50/50", "bg-orange-50/50"]; // Three colors: blue, green, orange
  
  // Sort group keys by date to ensure consistent color assignment
  const sortedGroupKeys = Object.keys(groupCounts)
    .filter(key => groupCounts[key] > 1)
    .sort((a, b) => {
      // Extract date from key (format: "yyyy-MM-dd-customerName")
      const dateA = a.split("-").slice(0, 3).join("-");
      const dateB = b.split("-").slice(0, 3).join("-");
      return dateA.localeCompare(dateB);
    });
  
  sortedGroupKeys.forEach((key) => {
    if (!groupColors.has(key)) {
      // Check if this date already has a color assigned
      const dateKey = key.split("-").slice(0, 3).join("-");
      let assignedColor = null;
      
      // Find if any group with the same date already has a color
      for (const [existingKey, existingColor] of groupColors.entries()) {
        const existingDateKey = existingKey.split("-").slice(0, 3).join("-");
        if (existingDateKey === dateKey) {
          assignedColor = existingColor;
          break;
        }
      }
      
      if (assignedColor) {
        // Use the same color for the same date
        groupColors.set(key, assignedColor);
      } else {
        // Assign a new color cycling through blue, green, orange
        groupColors.set(key, colors[colorIndex % colors.length]);
        colorIndex++;
      }
    }
  });

  function getRowBackgroundClass(entry: CylinderEntryRow): string {
    const key = getGroupKey(entry);
    if (groupCounts[key] > 1) {
      return groupColors.get(key) || "";
    }
    return "";
  }

  // Period filter removed - using month/year filters instead

  // Type filter removed - always use "all" (All Types)

  function updateURL(month: string, year: string) {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle month parameter
    if (month === "ALL" || !month) {
      params.delete("month");
    } else {
      params.set("month", month);
    }
    
    // Handle year parameter
    if (year === "ALL" || !year) {
      params.delete("year");
    } else {
      params.set("year", year);
    }
    
    // Reset to page 1 when filter changes
    params.set("page", "1");
    
    router.push(`/add-cylinder?${params.toString()}`);
  }

  const handleMonthChange = (month: string) => {
    setMonth(month);
  };

  const handleYearChange = (year: string) => {
    setYear(year);
  };

  // Generate year options (last 10 years to future 2 years)
  const years = Array.from({ length: 13 }, (_, i) => currentYear - 10 + i);
  
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Period filter removed - using month/year filters instead

  function handlePageSizeChange(newSize: string) {
    setPageSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", newSize);
    params.set("page", "1");
    router.push(`/add-cylinder?${params.toString()}`);
  }

  function handleDelete(id: string) {
    if (!canEdit) {
      toast.error("You are restricted by the super admin. You can only view this page. Editing and actions are not allowed.");
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCylinderEntry(id);
      if (result.success) {
        toast.error("Cylinder entry deleted successfully.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete entry");
      }
      setDeletingId(null);
    });
  }

  return (
    <Card className="min-w-0 rounded-[32px] border border-[#e5eaf4] bg-white shadow-none">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {query && query !== "all" ? (
              <h3 className="text-lg font-semibold text-slate-900">
                Cylinder List - {query.includes("·") ? query.replace(" · ", ". ") : query}
              </h3>
            ) : (
              <h3 className="text-lg font-semibold text-slate-900">Cylinder List</h3>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-11 w-[160px] rounded-[18px] border-[#dfe6f5] bg-white text-sm">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-xl">
                <SelectItem value="ALL">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="h-11 w-[160px] rounded-[18px] border-[#dfe6f5] bg-white text-sm">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-xl">
                <SelectItem value="ALL">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Customer Cylinder Summary */}
        {customerSummaries.length > 0 && (
          <div className="mt-6 border-2 border-blue-200 bg-blue-50/50 rounded-xl p-4 shadow-sm">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-blue-900 mb-1">Customer Cylinder Summary</h4>
              <p className="text-xs text-blue-700">Breakdown of cylinders given, received, and remaining per customer</p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-20 font-semibold text-slate-700 text-xs text-center">ID</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs text-center">Customer</TableHead>
                    <TableHead className="w-28 text-center font-semibold text-slate-700 text-xs">Total Delivered</TableHead>
                    <TableHead className="w-28 text-center font-semibold text-slate-700 text-xs">Total Received</TableHead>
                    <TableHead className="w-32 text-center font-semibold text-slate-700 text-xs whitespace-nowrap">Total Remaining</TableHead>
                    <TableHead className="w-28 text-center font-semibold text-slate-700 text-xs">Total Cylinders</TableHead>
                    <TableHead className="w-32 text-center font-semibold text-slate-700 text-xs">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSummaries
                    .sort((a, b) => {
                      if (a.customerCode !== null && b.customerCode !== null) {
                        return a.customerCode - b.customerCode;
                      }
                      if (a.customerCode !== null) return -1;
                      if (b.customerCode !== null) return 1;
                      return a.customerName.localeCompare(b.customerName);
                    })
                    .map((summary) => (
                      <TableRow key={summary.customerId || summary.customerName} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs font-medium text-slate-900 text-center">
                          {summary.customerCode ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-900 text-center">
                          {summary.customerName}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 hover:bg-blue-100 hover:text-blue-700">
                            {summary.totalDelivered}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5 hover:bg-emerald-100 hover:text-emerald-700">
                            {summary.totalReceived}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge
                            className={cn(
                              "rounded-full border text-xs px-2 py-0.5",
                              summary.remaining > 0
                                ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-700"
                                : summary.remaining === 0
                                ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                                : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-700"
                            )}
                          >
                            {summary.remaining}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge className="rounded-full bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 hover:bg-blue-100 hover:text-blue-700">
                            {summary.totalDelivered + summary.totalReceived}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs whitespace-nowrap">
                          <Badge className="rounded-full bg-red-100 text-red-700 border-red-200 text-xs px-2 py-0.5 hover:bg-red-100 hover:text-red-700">
                            {formatCurrency(summary.totalAmount || 0)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 text-center">Delivered Cylinder</TableHead>
                <TableHead className="w-28 text-center">Received Cylinder</TableHead>
                <TableHead className="w-24 text-center">Remaining cylinder</TableHead>
                <TableHead className="w-28 text-center">Unit Price</TableHead>
                <TableHead className="w-28 text-center">Total Price</TableHead>
                <TableHead className="w-28 text-center">Remaining Amount</TableHead>
                <TableHead className="w-32 text-center">Grand Total Amount</TableHead>
                <TableHead className="w-24 text-center">Cylinder Weight</TableHead>
                <TableHead className="w-32 text-center">Cylinder Type</TableHead>
                <TableHead className="w-32 text-center">Delivered By</TableHead>
                <TableHead className="w-32 text-center">Received Cylinder Type</TableHead>
                <TableHead className="w-28 text-center">Delivered Type</TableHead>
                <TableHead className="w-28 text-center">Verified</TableHead>
                <TableHead className="w-28 text-center">Received Cylinder Weight</TableHead>
                <TableHead className="w-32 text-center">Get By</TableHead>
                <TableHead className="w-28 text-center">Received Type</TableHead>
                <TableHead className="w-28 text-center">Verified</TableHead>
                <TableHead className="w-28 text-center">Date</TableHead>
                <TableHead className="w-36 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Since selectedCylinderType is always "all", show all aggregated DELIVERED entries
                const entriesToShow: CylinderEntryRow[] = Array.from(aggregatedDeliveredEntries.values());
                
                // Sort entries
                const filteredEntries = entriesToShow
                  .sort((a, b) => {
                    // Sort by date (descending) so latest records appear at the top
                    // If dates are the same, sort by creation time (descending) so latest created appears first
                    const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
                    const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
                    
                    // Primary sort: by deliveryDate (descending - newest first)
                    if (dateB !== dateA) {
                      return dateB - dateA;
                    }
                    
                    // Secondary sort: by createdAt (descending - latest created first)
                    // This ensures records with the same deliveryDate are sorted by when they were actually created/entered
                    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    
                    if (createdB !== createdA) {
                      return createdB - createdA;
                    }
                    
                    // Tertiary sort: by ID (descending) as final tiebreaker
                    return b.id.localeCompare(a.id);
                  });

                // Calculate cumulative Grand Total Amount for ALL entries (before pagination)
                // User wants Grand Total to INCREASE from top to bottom (newest-first display)
                // Strategy: Calculate cumulative totals from newest to oldest (backward in time)
                // - Newest entry (top): Gets just its own amount (smallest)
                // - Each older entry adds its amount, so totals increase as we go down
                const cumulativeTotals: number[] = [];
                let runningTotal = 0;
                
                // Calculate from newest to oldest (forward through the array, which is already newest-first)
                // This way, index 0 (newest) gets smallest value, last index (oldest) gets largest value
                filteredEntries.forEach((entry) => {
                  const totalPrice = entry.amount > 0 ? entry.amount : 0;
                  runningTotal += totalPrice;
                  cumulativeTotals.push(runningTotal);
                });
                
                // Apply client-side pagination to aggregated rows
                // Since aggregation happens client-side, we paginate the aggregated results
                const aggregatedPageSize = typeof pageSize === "number" && pageSize !== 10000 ? pageSize : filteredEntries.length;
                const aggregatedPage = page;
                const startIndex = (aggregatedPage - 1) * aggregatedPageSize;
                const endIndex = startIndex + aggregatedPageSize;
                const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
                
                // Now map entries with their corresponding cumulative totals
                return paginatedEntries.map((entry, paginatedIndex) => {
                  // Calculate original index in filteredEntries array (before pagination)
                  const originalIndex = startIndex + paginatedIndex;
                  
                  const rowBgClass = getRowBackgroundClass(entry);
                  const groupKey = getGroupKey(entry);
                  // Match RECEIVED data by date, customer, cylinderLabel, AND unitPrice
                  // RECEIVED entries only match to DELIVERED entries with the exact same price
                  const receivedMatchKey = getReceivedMatchKey(entry);
                  const receivedData = receivedDataByGroup.get(receivedMatchKey);
                  
                  // Get the cumulative total for this row (from our pre-calculated array using original index)
                  const cumulativeGrandTotal = originalIndex >= 0 && originalIndex < cumulativeTotals.length 
                    ? cumulativeTotals[originalIndex] 
                    : 0;
                  
                  // Calculate Remaining Amount: For the first record overall (index 0), show "Nill"
                  // For subsequent records, show the previous row's Grand Total
                  const isFirstOverall = originalIndex === 0;
                  const previousIndex = originalIndex - 1;
                  const currentRemainingAmount = isFirstOverall 
                    ? 0 
                    : (previousIndex >= 0 && previousIndex < cumulativeTotals.length 
                        ? cumulativeTotals[previousIndex] 
                        : 0);
                
                return (
                <TableRow key={entry.id} className={cn("text-sm align-middle", rowBgClass)}>
                  <TableCell className="text-slate-900">
                    {entry.quantity > 0
                      ? entry.quantity
                      : "—"}
                  </TableCell>
                  {/* Total Received Cylinder - sum of all RECEIVED entries for this group */}
                  <TableCell className="text-slate-900">
                    {receivedData && receivedData.quantity > 0
                      ? receivedData.quantity
                      : "—"}
                  </TableCell>
                  {/* Total Remaining: Delivered Cylinder Quantity - Total Received Cylinder */}
                  <TableCell className="text-slate-900">
                    {entry.quantity > 0
                      ? (() => {
                          const deliveredQty = entry.quantity;
                          const receivedQty = receivedData?.quantity ?? 0;
                          const remaining = deliveredQty - receivedQty;
                          return remaining >= 0 ? remaining : "—";
                        })()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-slate-700 whitespace-nowrap">
                    {entry.unitPrice > 0
                      ? formatCurrency(entry.unitPrice)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-slate-900 whitespace-nowrap">
                    {entry.amount > 0
                      ? formatCurrency(entry.amount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-slate-700 whitespace-nowrap">
                    {(() => {
                      if (entry.amount <= 0) {
                        return "—";
                      }
                      // For the first record overall (originalIndex === 0), show "Nill"
                      if (isFirstOverall) {
                        return "Nill";
                      }
                      // For second record onwards, show previous row's Grand Total
                      return currentRemainingAmount > 0 
                        ? formatCurrency(currentRemainingAmount)
                        : "—";
                    })()}
                  </TableCell>
                  <TableCell className="text-slate-900 font-semibold whitespace-nowrap">
                    {cumulativeGrandTotal > 0
                      ? formatCurrency(cumulativeGrandTotal)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {parseCylinderLabel(entry.cylinderLabel).weight}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {parseCylinderLabel(entry.cylinderLabel).type}
                  </TableCell>
                  <TableCell className="text-slate-600">{entry.deliveredBy || "—"}</TableCell>
                  <TableCell className="text-slate-700">
                    {receivedData ? receivedData.cylinderType : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-100 hover:text-blue-700">
                      Delivered
                    </Badge>
                  </TableCell>
                  {/* Verified for Delivered */}
                  <TableCell>
                    <Badge
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                        entry.verified
                          ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52] hover:bg-[#eefaf4] hover:text-[#1f8a52]"
                          : "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
                      )}
                    >
                      {entry.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {entry.verified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {receivedData ? receivedData.cylinderWeight : "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {receivedData && receivedData.deliveredBy ? receivedData.deliveredBy : "—"}
                  </TableCell>
                  <TableCell>
                    {receivedData ? (
                      <Badge className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold hover:bg-orange-100 hover:text-orange-700">
                        Received
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {/* Verified for Received */}
                  <TableCell>
                    {receivedData ? (
                      <Badge
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                          receivedData.verified
                            ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52] hover:bg-[#eefaf4] hover:text-[#1f8a52]"
                            : "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
                        )}
                      >
                        {receivedData.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {receivedData.verified ? "Verified" : "Pending"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {entry.deliveryDate ? format(entry.deliveryDate, "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingId(entry.id);
                          onView?.(entry);
                          // Reset after a short delay to allow drawer to open
                          setTimeout(() => setViewingId(null), 500);
                        }}
                        disabled={viewingId === entry.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                        title="View details"
                      >
                        {viewingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      {canEdit && (
                        <>
                      <button
                        type="button"
                        onClick={() => onEdit?.(entry)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit entry"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            disabled={deletingId === entry.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete entry"
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Cylinder Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this entry? This action cannot be undone. This will permanently delete the entry for {entry.customerName}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDownloadingId(entry.id);
                          window.location.href = `/add-cylinder/${entry.id}/download`;
                          setTimeout(() => setDownloadingId(null), 2000);
                        }}
                        disabled={downloadingId === entry.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-500 disabled:opacity-50"
                        title="Download bill"
                      >
                        {downloadingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                );
                });
              })()}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-sm text-slate-500">
                    No cylinder records found for this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <PaginationInfo 
              currentPage={page} 
              totalPages={(() => {
                const allFilteredEntriesCount = getFilteredEntriesCount();
                const pageSizeNum = typeof pageSize === "number" && pageSize !== 10000 ? pageSize : allFilteredEntriesCount;
                return Math.max(Math.ceil(allFilteredEntriesCount / pageSizeNum), 1);
              })()}
              pageSize={pageSize} 
              className="whitespace-nowrap" 
            />
            <Select
              value={String(pageSize)}
              onValueChange={(newSize) => handlePageSizeChange(newSize)}
              disabled={isPending}
            >
              <SelectTrigger className="h-10 min-w-[84px] rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-200">
                <SelectItem value="5" className="text-sm">5</SelectItem>
                <SelectItem value="10" className="text-sm">10</SelectItem>
                <SelectItem value="20" className="text-sm">20</SelectItem>
                <SelectItem value="50" className="text-sm">50</SelectItem>
                <SelectItem value="100" className="text-sm">100</SelectItem>
                <SelectItem value="all" className="text-sm">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Pagination
            currentPage={page}
            totalPages={(() => {
              const allFilteredEntriesCount = getFilteredEntriesCount();
              const pageSizeNum = typeof pageSize === "number" && pageSize !== 10000 ? pageSize : allFilteredEntriesCount;
              return Math.max(Math.ceil(allFilteredEntriesCount / pageSizeNum), 1);
            })()}
            pageSize={pageSize}
            previousHref={(() => {
              const allFilteredEntriesCount = getFilteredEntriesCount();
              const pageSizeNum = typeof pageSize === "number" && pageSize !== 10000 ? pageSize : allFilteredEntriesCount;
              const totalPagesCalc = Math.max(Math.ceil(allFilteredEntriesCount / pageSizeNum), 1);
              return page > 1 ? buildCylinderParams(page - 1, query, period, pageSize, preserveParams) : undefined;
            })()}
            nextHref={(() => {
              const allFilteredEntriesCount = getFilteredEntriesCount();
              const pageSizeNum = typeof pageSize === "number" && pageSize !== 10000 ? pageSize : allFilteredEntriesCount;
              const totalPagesCalc = Math.max(Math.ceil(allFilteredEntriesCount / pageSizeNum), 1);
              return page < totalPagesCalc ? buildCylinderParams(page + 1, query, period, pageSize, preserveParams) : undefined;
            })()}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerLabelDisplay({ value }: { value: string }) {
  const [idPart, ...rest] = value.split("·");
  const id = idPart?.replace(/[^0-9]/g, "").trim() || idPart?.trim() || "—";
  const name = rest.join("·").trim() || value;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-slate-900">{id}</span>
      <span className="text-xs text-slate-500">{name}</span>
    </div>
  );
}

