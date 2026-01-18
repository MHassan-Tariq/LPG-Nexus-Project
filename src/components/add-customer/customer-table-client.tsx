"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteCustomer } from "@/app/(dashboard)/add-customer/actions";
import { CustomerViewDrawer } from "./customer-view-drawer";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export interface CustomerRow {
  id: string;
  customerCode: number;
  name: string;
  contactNumber: string;
  customerType: string;
  cylinderType: string;
  billType: string;
  address?: string | null;
  status: string;
}

const statusBadgeMap: Record<string, string> = {
  ACTIVE: "border-green-200 bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 hover:border-green-200",
  INACTIVE: "border-red-200 bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700 hover:border-red-200",
};

interface CustomerTableClientProps {
  customers: CustomerRow[];
  query: string;
  page: number;
  totalPages: number;
  pageSize: number | string;
  basePath?: string;
  onView?: (customer: CustomerRow) => void;
  onEdit?: (customer: CustomerRow) => void;
}

function buildCustomerParams(nextPage: number, query: string, pageSize: number | string, basePath: string = "/add-customer") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(nextPage));
  params.set("pageSize", String(pageSize));
  return `${basePath}?${params.toString()}`;
}

/**
 * Truncates address to 2 words or 15 characters (whichever comes first)
 * Shows "..." when truncated
 * @param address - The full address string
 * @returns Truncated address with "..." if needed
 */
function truncateAddress(address: string | null | undefined): string {
  if (!address || address.trim() === "") return "—";
  
  const trimmed = address.trim();
  
  // If address is 15 characters or less, return as-is
  if (trimmed.length <= 15) {
    return trimmed;
  }
  
  // Split into words
  const words = trimmed.split(/\s+/);
  
  // If 2 words or less, truncate at 15 characters
  if (words.length <= 2) {
    return trimmed.substring(0, 15) + "...";
  }
  
  // Take first 2 words
  const twoWords = words.slice(0, 2).join(" ");
  
  // If 2 words are within 15 characters, use them
  if (twoWords.length <= 15) {
    return twoWords + "...";
  }
  
  // If 2 words exceed 15 characters, truncate at 15 chars
  return twoWords.substring(0, 15) + "...";
}

/**
 * Formats customer type by adding " cylinder" at the end
 * @param customerType - The customer type (e.g., "Business", "Commercial", "Domestic")
 * @returns Formatted customer type (e.g., "Business cylinder")
 */
function formatCustomerType(customerType: string): string {
  if (!customerType) return "—";
  const trimmed = customerType.trim();
  // If it already ends with "cylinder", return as-is, otherwise add " cylinder"
  if (trimmed.toLowerCase().endsWith("cylinder")) {
    return trimmed;
  }
  return trimmed + " cylinder";
}

/**
 * Formats cylinder type to extract just the weight (e.g., "12kg", "35kg", "45kg")
 * @param cylinderType - The cylinder type (e.g., "12kg (Domestic cylinder)")
 * @returns Formatted cylinder type (e.g., "12kg")
 */
function formatCylinderType(cylinderType: string): string {
  if (!cylinderType) return "—";
  const trimmed = cylinderType.trim();
  // Extract weight part (everything before the space or parenthesis)
  const match = trimmed.match(/^(\d+kg)/i);
  if (match) {
    return match[1];
  }
  // If no match, return the original (fallback)
  return trimmed;
}

/**
 * Returns CSS classes for bill type badge
 * @param billType - The bill type ("Cash" or "Credit")
 * @returns CSS classes string
 */
function getBillTypeBadgeClasses(billType: string): string {
  const baseClasses = "rounded-full px-3 py-1 text-xs font-medium";
  if (billType.toLowerCase() === "cash") {
    return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
  } else if (billType.toLowerCase() === "credit") {
    return `${baseClasses} bg-orange-100 text-orange-700 border border-orange-200`;
  }
  // Default styling
  return `${baseClasses} bg-slate-100 text-slate-600`;
}

export function CustomerTableClient({
  customers,
  query,
  page,
  totalPages,
  pageSize: initialPageSize,
  basePath = "/add-customer",
  onView,
  onEdit,
}: CustomerTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(initialPageSize);

  function handlePageSizeChange(newSize: string) {
    setPageSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", newSize);
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCustomer(id);
      if (result.success) {
        toast.error("Customer deleted successfully.");
        // Preserve current page and other params
        const currentParams = new URLSearchParams(searchParams.toString());
        const params = new URLSearchParams();
        if (currentParams.get('page')) params.set('page', currentParams.get('page')!);
        if (currentParams.get('q')) params.set('q', currentParams.get('q')!);
        if (currentParams.get('pageSize')) params.set('pageSize', currentParams.get('pageSize')!);
        router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ''}`);
      } else {
        toast.error(result.error || "Failed to delete customer");
      }
      setDeletingId(null);
    });
  }

  function handleView(customer: CustomerRow) {
    setViewingId(customer.id);
    if (onView) {
      onView(customer);
    } else {
      // Reset after a short delay to allow drawer to open
      setTimeout(() => setViewingId(null), 500);
    }
  }

  function handleEdit(customer: CustomerRow) {
    setEditingId(customer.id);
    if (onEdit) {
      onEdit(customer);
      setTimeout(() => setEditingId(null), 500);
    } else {
      // Default: navigate to edit page
      router.push(`${basePath}/${customer.id}/edit`);
      setTimeout(() => setEditingId(null), 500);
    }
  }

  const viewingCustomer = customers.find((c) => c.id === viewingId) || null;

  return (
    <>
      <CardContent className="p-0">
        {isPending ? (
          <div className="p-6">
            <TableSkeleton rows={pageSize === "all" ? 10 : Number(pageSize)} columns={9} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36 whitespace-nowrap font-semibold text-slate-600">Customer ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600">Customer Name</TableHead>
                  <TableHead className="w-40 whitespace-nowrap font-semibold text-slate-600">Contact Number</TableHead>
                  <TableHead className="w-32 whitespace-nowrap font-semibold text-slate-600">Customer Type</TableHead>
                  <TableHead className="w-40 whitespace-nowrap font-semibold text-slate-600">Cylinder Type</TableHead>
                  <TableHead className="w-32 whitespace-nowrap font-semibold text-slate-600">Bill Type</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-slate-600">Address</TableHead>
                  <TableHead className="w-32 whitespace-nowrap text-center font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="w-32 whitespace-nowrap text-center font-semibold text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => {
                  return (
                  <TableRow key={customer.id} className="text-slate-700">
                    <TableCell className="font-medium text-slate-900">{customer.customerCode}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.contactNumber}</TableCell>
                    <TableCell>{formatCustomerType(customer.customerType)}</TableCell>
                    <TableCell>{formatCylinderType(customer.cylinderType)}</TableCell>
                    <TableCell>
                      <span className={getBillTypeBadgeClasses(customer.billType)}>
                        {customer.billType}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-nowrap overflow-hidden text-ellipsis text-slate-500">
                      {truncateAddress(customer.address)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-none",
                          statusBadgeMap[customer.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"],
                        )}
                      >
                        {customer.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(customer)}
                          disabled={viewingId === customer.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                          title="View details"
                        >
                          {viewingId === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          disabled={editingId === customer.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                          title="Edit customer"
                        >
                          {editingId === customer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={deletingId === customer.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Delete customer"
                            >
                              {deletingId === customer.id ? (
                               <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete customer {customer.name}? This action cannot be undone. This will permanently delete all associated records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(customer.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                      No customers found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <PaginationInfo currentPage={page} totalPages={Math.max(totalPages, 1)} pageSize={pageSize} className="whitespace-nowrap" />
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
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
              totalPages={Math.max(totalPages, 1)}
              pageSize={pageSize}
              previousHref={page > 1 ? buildCustomerParams(page - 1, query, pageSize, basePath) : undefined}
              nextHref={page < Math.max(totalPages, 1) ? buildCustomerParams(page + 1, query, pageSize, basePath) : undefined}
              disabled={isPending}
            />
          </div>
        </CardContent>
      {viewingCustomer && (
        <CustomerViewDrawer
          customerId={viewingCustomer.id}
          open={!!viewingId}
          onOpenChange={(open) => !open && setViewingId(null)}
          onEdit={(customerId) => {
            setViewingId(null);
            if (onEdit) {
              // Find the customer and call onEdit
              const customer = customers.find(c => c.id === customerId);
              if (customer) {
                onEdit(customer);
              }
            }
          }}
        />
      )}
    </>
  );
}

