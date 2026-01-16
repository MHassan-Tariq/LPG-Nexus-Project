"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Receipt, Download, Trash2, FileCheck, FileX, Eye, CheckSquare, Square, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BillViewDrawer } from "@/components/payments/bill-view-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CylinderViewDrawer } from "@/components/add-cylinder/cylinder-view-drawer";
import { deleteCylinderEntry, getCylinderEntry } from "@/app/add-cylinder/actions";
import { toast } from "sonner";
import type { CylinderEntryRow } from "@/components/add-cylinder/cylinder-table";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "PKR", maximumFractionDigits: 0 });

export interface CylinderEntryDetail {
  id: string;
  deliveryDate: Date;
  cylinderLabel: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  deliveredBy: string | null;
  billCreatedBy: string | null;
  description: string | null;
}

export interface BillWithInvoice {
  id: string;
  code: string;
  name: string;
  billStartDate: Date;
  billEndDate: Date;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  lastMonthRemaining?: number;
  currentMonthBill?: number;
  cylinders?: number;
  cylinderEntries?: CylinderEntryDetail[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    generatedAt: Date;
  } | null;
}

interface InvoiceManagementPageProps {
  bills: BillWithInvoice[];
  initialCustomerFilter?: string;
}

export function InvoiceManagementPage({ bills, initialCustomerFilter }: InvoiceManagementPageProps) {
  const router = useRouter();
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [viewingBillId, setViewingBillId] = useState<string | null>(null);
  const [isDownloadingCombined, setIsDownloadingCombined] = useState(false);
  const [expandedBills, setExpandedBills] = useState<Set<string>>(new Set());
  const [currentCustomerFilter, setCurrentCustomerFilter] = useState<string | null>(initialCustomerFilter || null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<CylinderEntryRow | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [isDownloadingEntries, setIsDownloadingEntries] = useState(false);
  
  // Get unique customers from bills
  const uniqueCustomers = Array.from(
    new Map(bills.map((bill) => [bill.name, { name: bill.name, code: bill.code }])).values()
  );

  function handleCustomerFilter(customerName: string | null) {
    setCurrentCustomerFilter(customerName);
    const params = new URLSearchParams();
    if (customerName) {
      params.set("customer", customerName);
    }
    const queryString = params.toString();
    router.push(`/payments/invoices${queryString ? `?${queryString}` : ""}`);
  }

  async function handleDownloadSelectedEntries() {
    if (selectedEntryIds.size === 0) {
      toast.error("Please select at least one entry to download");
      return;
    }

    setIsDownloadingEntries(true);
    try {
      const response = await fetch("/api/cylinder-entries/combine-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntryIds),
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to generate combined bill (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      
      // Check if the response is actually a PDF
      if (blob.type !== "application/pdf") {
        const text = await blob.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: "Invalid response format" };
        }
        throw new Error(errorData.error || "Server returned an invalid response");
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `combined-entries-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Combined bill downloaded successfully (${selectedEntryIds.size} entries)`);
    } catch (error) {
      console.error("Error downloading combined entries:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download combined bill";
      toast.error(errorMessage);
    } finally {
      setIsDownloadingEntries(false);
    }
  }

  const selectedBills = bills.filter((bill) => selectedBillIds.has(bill.id));
  const billsWithInvoices = selectedBills.filter((bill) => bill.invoice);
  const billsWithoutInvoices = selectedBills.filter((bill) => !bill.invoice);

  function handleToggleBill(billId: string) {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) {
        next.delete(billId);
      } else {
        next.add(billId);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedBillIds.size === bills.length) {
      setSelectedBillIds(new Set());
    } else {
      setSelectedBillIds(new Set(bills.map((bill) => bill.id)));
    }
  }

  async function handleGenerateInvoices() {
    if (billsWithoutInvoices.length === 0) {
      setStatusMessage({ type: "error", message: "Selected bills already have invoices. Please select bills without invoices." });
      return;
    }

    setStatusMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/invoices/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billIds: billsWithoutInvoices.map((bill) => bill.id),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to generate invoices");
        }

        if (result.success) {
          setStatusMessage({
            type: "success",
            message: `Successfully generated ${result.results.filter((r: any) => r.success).length} invoice(s).`,
          });
          setSelectedBillIds(new Set());
          setTimeout(() => {
            router.refresh();
          }, 1000);
        } else {
          setStatusMessage({
            type: "error",
            message: result.message || "Some invoices failed to generate",
          });
        }
      } catch (error) {
        console.error("Error generating invoices:", error);
        setStatusMessage({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to generate invoices",
        });
      }
    });
  }

  async function handleDownloadInvoice(invoiceNumber: string) {
    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}/download`);
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStatusMessage({ type: "success", message: `Invoice ${invoiceNumber} downloaded successfully.` });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to download invoice",
      });
    }
  }

  async function handleDownloadBill(billId: string) {
    try {
      window.open(`/payments/${billId}/download`, "_blank");
    } catch (error) {
      console.error("Error opening bill:", error);
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to open bill",
      });
    }
  }

  async function handleDownloadCombinedBills() {
    if (selectedBillIds.size === 0) {
      setStatusMessage({ type: "error", message: "Please select at least one bill to download." });
      return;
    }

    setIsDownloadingCombined(true);
    setStatusMessage(null);
    
    try {
      const response = await fetch("/api/bills/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billIds: Array.from(selectedBillIds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate combined bill");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `combined-bills-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStatusMessage({ type: "success", message: `Combined bill downloaded successfully.` });
    } catch (error) {
      console.error("Error downloading combined bills:", error);
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to download combined bill",
      });
    } finally {
      setIsDownloadingCombined(false);
    }
  }

  async function handleDeleteInvoice(invoiceId: string, invoiceNumber: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to delete invoice");
        }

        setStatusMessage({
          type: "success",
          message: `Invoice ${invoiceNumber} deleted successfully.`,
        });
        setSelectedBillIds((prev) => {
          const next = new Set(prev);
          const bill = bills.find((b) => b.invoice?.id === invoiceId);
          if (bill) next.delete(bill.id);
          return next;
        });
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (error) {
        console.error("Error deleting invoice:", error);
        setStatusMessage({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to delete invoice",
        });
      }
    });
  }

  async function handleDeleteAllInvoices() {
    if (billsWithInvoices.length === 0) {
      setStatusMessage({ type: "error", message: "No invoices selected for deletion." });
      return;
    }

    const invoiceIds = billsWithInvoices
      .map((bill) => bill.invoice?.id)
      .filter((id): id is string => !!id);

    if (invoiceIds.length === 0) {
      return;
    }

    setStatusMessage(null);
    startTransition(async () => {
      try {
        const deletePromises = invoiceIds.map((invoiceId) =>
          fetch(`/api/invoices/${invoiceId}`, {
            method: "DELETE",
          }).then((res) => res.json())
        );

        const results = await Promise.all(deletePromises);
        const failedDeletes = results.filter((result) => !result.success || result.error);

        if (failedDeletes.length > 0) {
          throw new Error(
            `Failed to delete ${failedDeletes.length} of ${invoiceIds.length} invoice(s).`
          );
        }

        setStatusMessage({
          type: "success",
          message: `Successfully deleted ${invoiceIds.length} invoice(s).`,
        });
        setSelectedBillIds(new Set());
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (error) {
        console.error("Error deleting invoices:", error);
        setStatusMessage({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to delete invoices",
        });
      }
    });
  }

  return (
    <>
    <Card className="rounded-[32px] border border-[#e5eaf4] bg-white shadow-sm">
      <CardContent className="p-6">
          <div className="space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`rounded-lg p-3 text-sm ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

            {/* Customer Filter */}
            {uniqueCustomers.length > 1 && (
              <div className="mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">Filter by Customer:</span>
                  <Button
                    variant={!currentCustomerFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomerFilter(null)}
                    className="h-8 text-xs"
                  >
                    All Customers
                  </Button>
                  {uniqueCustomers.map((customer) => (
                    <Button
                      key={customer.name}
                      variant={currentCustomerFilter === customer.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCustomerFilter(customer.name)}
                      className="h-8 text-xs"
                    >
                      {customer.name} ({customer.code})
                    </Button>
                  ))}
                </div>
                {currentCustomerFilter && (
                  <p className="text-xs text-slate-500 mt-2">
                    Showing bills for: <strong>{currentCustomerFilter}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Bills Grid */}
                {bills.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                      No bills available.
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${currentCustomerFilter ? "mt-6" : ""}`}>
                {bills.map((bill) => (
                  <Card
                    key={bill.id}
                    className={`rounded-xl border-2 transition-all border-t-4 ${
                      selectedBillIds.has(bill.id)
                        ? "border-[#1f64ff] bg-blue-50/50 border-t-[#1f64ff]"
                        : "border-[#e5eaf4] bg-white hover:border-slate-300 border-t-slate-300"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Checkbox and Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedBillIds.has(bill.id)}
                          onCheckedChange={() => handleToggleBill(bill.id)}
                              className="mt-1"
                            />
                            <div>
                              <h3 className="font-semibold text-slate-900">Bill #{bill.code}</h3>
                              <button
                                type="button"
                                onClick={() => handleCustomerFilter(bill.name)}
                                className="text-sm text-slate-600 hover:text-[#1f64ff] hover:underline transition-colors"
                              >
                                {bill.name}
                              </button>
                            </div>
                          </div>
                        {bill.invoice ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                            <FileCheck className="h-4 w-4" />
                          </div>
                        ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                            <FileX className="h-4 w-4" />
                          </div>
                        )}
                        </div>

                        {/* Bill Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Period:</span>
                            <span className="text-slate-700 font-medium">
                              {format(bill.billStartDate, "MMM d")} - {format(bill.billEndDate, "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total Amount:</span>
                            <span className="text-slate-900 font-semibold whitespace-nowrap">
                              {formatCurrency(bill.totalAmount)}
                            </span>
                          </div>
                          {bill.paidAmount !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Paid:</span>
                              <span className="text-emerald-600 font-medium whitespace-nowrap">
                                {formatCurrency(bill.paidAmount)}
                              </span>
                            </div>
                          )}
                          {bill.remainingAmount !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Remaining:</span>
                              <span className="text-rose-600 font-medium whitespace-nowrap">
                                {formatCurrency(bill.remainingAmount)}
                              </span>
                            </div>
                          )}
                          {bill.cylinders !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Cylinders:</span>
                              <span className="text-slate-700 font-medium">{bill.cylinders}</span>
                          </div>
                        )}
                        </div>

                        {/* Expandable Cylinder Entries */}
                        {bill.cylinderEntries && bill.cylinderEntries.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExpandedBills((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(bill.id)) {
                                    next.delete(bill.id);
                                  } else {
                                    next.add(bill.id);
                                  }
                                  return next;
                                });
                              }}
                              className="w-full justify-between h-8 text-xs"
                            >
                              <span className="text-slate-600">
                                View Details ({bill.cylinderEntries.length} entries)
                              </span>
                              {expandedBills.has(bill.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            
                            {expandedBills.has(bill.id) && (
                              <div className="mt-3 space-y-2">
                                {/* Select All for this bill's entries */}
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                  <Checkbox
                                    checked={bill.cylinderEntries.every((entry) => selectedEntryIds.has(entry.id))}
                                    onCheckedChange={(checked) => {
                                      setSelectedEntryIds((prev) => {
                                        const next = new Set(prev);
                                        if (checked) {
                                          bill.cylinderEntries.forEach((entry) => next.add(entry.id));
                                        } else {
                                          bill.cylinderEntries.forEach((entry) => next.delete(entry.id));
                                        }
                                        return next;
                                      });
                                    }}
                                  />
                                  <label className="text-xs font-medium text-slate-600 cursor-pointer">
                                    Select All Entries
                                  </label>
                                </div>
                                
                                {/* Individual Entry Cards */}
                                {bill.cylinderEntries.map((entry) => (
                                  <Card
                                    key={entry.id}
                                    className={`rounded-lg border-2 transition-all ${
                                      selectedEntryIds.has(entry.id)
                                        ? "border-[#1f64ff] bg-blue-50/50"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-3">
                                        <Checkbox
                                          checked={selectedEntryIds.has(entry.id)}
                                          onCheckedChange={(checked) => {
                                            setSelectedEntryIds((prev) => {
                                              const next = new Set(prev);
                                              if (checked) {
                                                next.add(entry.id);
                                              } else {
                                                next.delete(entry.id);
                                              }
                                              return next;
                                            });
                                          }}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-slate-500">Date:</span>
                                            <span className="ml-2 text-slate-700 font-medium">
                                              {format(entry.deliveryDate, "MMM d, yyyy")}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Cylinder Type:</span>
                                            <span className="ml-2 text-slate-700">
                                              {entry.cylinderLabel || "—"}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Quantity:</span>
                                            <span className="ml-2 text-slate-900 font-semibold">
                                              {formatNumber(entry.quantity)}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Unit Price:</span>
                                            <span className="ml-2 text-slate-700 whitespace-nowrap">
                                              {formatCurrency(entry.unitPrice)}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Amount:</span>
                                            <span className="ml-2 text-slate-900 font-semibold whitespace-nowrap">
                                              {formatCurrency(entry.amount)}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">Delivered By:</span>
                                            <span className="ml-2 text-slate-600">
                                              {entry.deliveredBy || "—"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {/* Action Buttons */}
                                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            setLoadingEntry(true);
                                            try {
                                              const result = await getCylinderEntry(entry.id);
                                              if (result.success && result.data) {
                                                // Convert to CylinderEntryRow format
                                                const entryRow: CylinderEntryRow = {
                                                  id: result.data.id,
                                                  billCreatedBy: result.data.billCreatedBy,
                                                  cylinderType: result.data.cylinderType as "DELIVERED" | "RECEIVED",
                                                  cylinderLabel: result.data.cylinderLabel,
                                                  deliveredBy: result.data.deliveredBy,
                                                  quantity: result.data.quantity,
                                                  unitPrice: result.data.unitPrice,
                                                  amount: result.data.amount,
                                                  customerName: result.data.customerName,
                                                  verified: result.data.verified,
                                                  description: result.data.description,
                                                  deliveryDate: result.data.deliveryDate,
                                                  paymentType: result.data.paymentType,
                                                  paymentAmount: result.data.paymentAmount,
                                                  paymentReceivedBy: result.data.paymentReceivedBy,
                                                  emptyCylinderReceived: result.data.emptyCylinderReceived,
                                                };
                                                setViewingEntry(entryRow);
                                                setViewingEntryId(entry.id);
                                              } else {
                                                toast.error(result.error || "Failed to load entry details");
                                              }
                                            } catch (error) {
                                              toast.error("Failed to load entry details");
                                            } finally {
                                              setLoadingEntry(false);
                                            }
                                          }}
                                          disabled={loadingEntry}
                                          className="flex-1 h-8 text-xs"
                                        >
                                          {loadingEntry ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                          ) : (
                                            <Eye className="mr-1 h-3 w-3" />
                                          )}
                                          View
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled={deletingEntryId === entry.id}
                                              className="flex-1 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            >
                                              {deletingEntryId === entry.id ? (
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                              ) : (
                                                <Trash2 className="mr-1 h-3 w-3" />
                                              )}
                                              Delete
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Cylinder Entry</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete this cylinder entry?
                                                <br />
                                                <strong>Date:</strong> {format(entry.deliveryDate, "MMM d, yyyy")}
                                                <br />
                                                <strong>Quantity:</strong> {formatNumber(entry.quantity)}
                                                <br />
                                                <strong>Amount:</strong> {formatCurrency(entry.amount)}
                                                <br />
                                                This action cannot be undone and will update the bill automatically.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={async () => {
                                                  setDeletingEntryId(entry.id);
                                                  try {
                                                    const result = await deleteCylinderEntry(entry.id);
                                                    if (result.success) {
                                                      toast.success("Cylinder entry deleted successfully");
                                                      router.refresh();
                                                    } else {
                                                      toast.error(result.error || "Failed to delete entry");
                                                    }
                                                  } catch (error) {
                                                    toast.error("Failed to delete entry");
                                                  } finally {
                                                    setDeletingEntryId(null);
                                                  }
                                                }}
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                                
                                {/* Total Summary */}
                                <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 rounded-lg p-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-900">Total:</span>
                                    <div className="flex gap-4">
                                      <div className="text-right">
                                        <span className="text-slate-500 text-xs">Quantity: </span>
                                        <span className="font-semibold text-slate-900">
                                          {formatNumber(bill.cylinderEntries.reduce((sum, e) => sum + e.quantity, 0))}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-slate-500 text-xs">Amount: </span>
                                        <span className="font-semibold text-slate-900 whitespace-nowrap">
                                          {formatCurrency(bill.cylinderEntries.reduce((sum, e) => sum + e.amount, 0))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Invoice Status */}
                        {bill.invoice && (
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Invoice:</span>
                              <span className="text-emerald-600 font-medium">{bill.invoice.invoiceNumber}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-slate-500">Generated:</span>
                              <span className="text-slate-600">
                                {format(bill.invoice.generatedAt, "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingBillId(bill.id)}
                            className="flex-1 h-9"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBill(bill.id)}
                            className="flex-1 h-9"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          {bill.invoice && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice {bill.invoice.invoiceNumber}? 
                                    This will allow you to generate a new invoice for this bill. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvoice(bill.invoice!.id, bill.invoice!.invoiceNumber)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
          </div>
        </div>
      </CardContent>
    </Card>
                ))}
              </div>
            )}

            {/* Customer Entries Summary (when filtered) */}
            {currentCustomerFilter && bills.length > 0 && (
              <div className="space-y-4">
                {/* Total Summary Card */}
                {(() => {
                  const allEntries = bills.flatMap((bill) => bill.cylinderEntries || []);
                  const totalQuantity = allEntries.reduce((sum, e) => sum + e.quantity, 0);
                  const totalAmount = allEntries.reduce((sum, e) => sum + e.amount, 0);
                  const uniqueDates = Array.from(new Set(allEntries.map((e) => format(e.deliveryDate, "yyyy-MM-dd")))).sort();
                  
                  return (
                    <Card className="rounded-xl border-2 border-[#1f64ff] bg-blue-50/50">
                      <CardContent className="p-5">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Total Summary - {currentCustomerFilter}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Total Entries:</span>
                              <span className="ml-2 font-semibold text-slate-900">{allEntries.length}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Total Quantity:</span>
                              <span className="ml-2 font-semibold text-slate-900">{formatNumber(totalQuantity)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Total Amount:</span>
                              <span className="ml-2 font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Date Range:</span>
                              <span className="ml-2 font-semibold text-slate-900">
                                {uniqueDates.length > 0 
                                  ? `${format(new Date(uniqueDates[0]), "MMM d")} - ${format(new Date(uniqueDates[uniqueDates.length - 1]), "MMM d, yyyy")}`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Action Bar */}
                <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 mt-6">
                  <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <strong>Selected:</strong> {selectedEntryIds.size} {selectedEntryIds.size === 1 ? "entry" : "entries"}
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const allEntries = bills.flatMap((bill) => bill.cylinderEntries || []);
                        const allEntryIds = allEntries.map((e) => e.id);
                        const allSelected = allEntries.length > 0 && allEntries.every((entry) => selectedEntryIds.has(entry.id));
                        
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (allEntryIds.length === 0) {
                                toast.error("No entries available to select");
                                return;
                              }
                              
                              setSelectedEntryIds((prev) => {
                                const next = new Set(prev);
                                
                                if (allSelected) {
                                  // Deselect all
                                  allEntryIds.forEach((id) => next.delete(id));
                                } else {
                                  // Select all
                                  allEntryIds.forEach((id) => next.add(id));
                                }
                                
                                return next;
                              });
                            }}
                            disabled={allEntryIds.length === 0}
                            className="h-9"
                          >
                            {allSelected ? (
                              <>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Deselect All
                              </>
                            ) : (
                              <>
                                <Square className="mr-2 h-4 w-4" />
                                Select All
                              </>
                            )}
                          </Button>
                        );
                      })()}
                    </div>
                </div>

                  <div className="flex flex-wrap gap-3">
                  {/* Download Selected Entries Button */}
                  {selectedEntryIds.size > 0 && (
                    <Button
                      onClick={handleDownloadSelectedEntries}
                      disabled={isDownloadingEntries}
                      className="flex-1 min-w-[200px] bg-[#1f64ff] hover:bg-[#1647c4] text-white"
                    >
                      {isDownloadingEntries ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Selected Bills ({selectedEntryIds.size})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

                {/* Individual Entry Cards Grouped by Date */}
                {(() => {
                  const allEntries = bills.flatMap((bill) => bill.cylinderEntries || []);
                  const entriesByDate = allEntries.reduce((acc, entry) => {
                    const dateKey = format(entry.deliveryDate, "yyyy-MM-dd");
                    if (!acc[dateKey]) {
                      acc[dateKey] = [];
                    }
                    acc[dateKey].push(entry);
                    return acc;
                  }, {} as Record<string, typeof allEntries>);

                  const sortedDates = Object.keys(entriesByDate).sort();

                  return (
                    <div className="space-y-4">
                      {sortedDates.map((dateKey) => {
                        const entries = entriesByDate[dateKey];
                        const dateTotal = entries.reduce((sum, e) => sum + e.amount, 0);
                        const dateQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);

                        return (
                          <div key={dateKey} className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                              <h4 className="text-sm font-semibold text-slate-700">
                                {format(new Date(dateKey), "MMMM d, yyyy")}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span>Qty: <strong className="text-slate-900">{formatNumber(dateQuantity)}</strong></span>
                                <span>Total: <strong className="text-slate-900 whitespace-nowrap">{formatCurrency(dateTotal)}</strong></span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {entries.map((entry) => (
                                <Card
                                  key={entry.id}
                                  className={`rounded-lg border-2 transition-all ${
                                    selectedEntryIds.has(entry.id)
                                      ? "border-[#1f64ff] bg-blue-50/50"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
            <Checkbox
                                        checked={selectedEntryIds.has(entry.id)}
                                        onCheckedChange={(checked) => {
                                          setSelectedEntryIds((prev) => {
                                            const next = new Set(prev);
                                            if (checked) {
                                              next.add(entry.id);
                                            } else {
                                              next.delete(entry.id);
                                            }
                                            return next;
                                          });
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-slate-500">Date:</span>
                                          <span className="ml-2 text-slate-700 font-medium">
                                            {format(entry.deliveryDate, "MMM d, yyyy")}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Cylinder Type:</span>
                                          <span className="ml-2 text-slate-700">
                                            {entry.cylinderLabel || "—"}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Quantity:</span>
                                          <span className="ml-2 text-slate-900 font-semibold">
                                            {formatNumber(entry.quantity)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Unit Price:</span>
                                          <span className="ml-2 text-slate-700 whitespace-nowrap">
                                            {formatCurrency(entry.unitPrice)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Amount:</span>
                                          <span className="ml-2 text-slate-900 font-semibold whitespace-nowrap">
                                            {formatCurrency(entry.amount)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Delivered By:</span>
                                          <span className="ml-2 text-slate-600">
                                            {entry.deliveredBy || "—"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          setLoadingEntry(true);
                                          try {
                                            const result = await getCylinderEntry(entry.id);
                                            if (result.success && result.data) {
                                              // Convert to CylinderEntryRow format
                                              const entryRow: CylinderEntryRow = {
                                                id: result.data.id,
                                                billCreatedBy: result.data.billCreatedBy,
                                                cylinderType: result.data.cylinderType as "DELIVERED" | "RECEIVED",
                                                cylinderLabel: result.data.cylinderLabel,
                                                deliveredBy: result.data.deliveredBy,
                                                quantity: result.data.quantity,
                                                unitPrice: result.data.unitPrice,
                                                amount: result.data.amount,
                                                customerName: result.data.customerName,
                                                verified: result.data.verified,
                                                description: result.data.description,
                                                deliveryDate: result.data.deliveryDate,
                                                paymentType: result.data.paymentType,
                                                paymentAmount: result.data.paymentAmount,
                                                paymentReceivedBy: result.data.paymentReceivedBy,
                                                emptyCylinderReceived: result.data.emptyCylinderReceived,
                                              };
                                              setViewingEntry(entryRow);
                                              setViewingEntryId(entry.id);
                                            } else {
                                              toast.error(result.error || "Failed to load entry details");
                                            }
                                          } catch (error) {
                                            toast.error("Failed to load entry details");
                                          } finally {
                                            setLoadingEntry(false);
                                          }
                                        }}
                                        disabled={loadingEntry}
                                        className="flex-1 h-8 text-xs"
                                      >
                                        {loadingEntry ? (
                                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        ) : (
                                          <Eye className="mr-1 h-3 w-3" />
                                        )}
                                        View
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={deletingEntryId === entry.id}
                                            className="flex-1 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                          >
                                            {deletingEntryId === entry.id ? (
                                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="mr-1 h-3 w-3" />
                                            )}
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Cylinder Entry</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this cylinder entry?
                                              <br />
                                              <strong>Date:</strong> {format(entry.deliveryDate, "MMM d, yyyy")}
                                              <br />
                                              <strong>Quantity:</strong> {formatNumber(entry.quantity)}
                                              <br />
                                              <strong>Amount:</strong> {formatCurrency(entry.amount)}
                                              <br />
                                              This action cannot be undone and will update the bill automatically.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={async () => {
                                                setDeletingEntryId(entry.id);
                                                try {
                                                  const result = await deleteCylinderEntry(entry.id);
                                                  if (result.success) {
                                                    toast.success("Cylinder entry deleted successfully");
                                                    router.refresh();
                                                  } else {
                                                    toast.error(result.error || "Failed to delete entry");
                                                  }
                                                } catch (error) {
                                                  toast.error("Failed to delete entry");
                                                } finally {
                                                  setDeletingEntryId(null);
                                                }
                                              }}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
          </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
          </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill View Drawer */}
      {viewingBillId && (
        <BillViewDrawer
          billId={viewingBillId}
          open={!!viewingBillId}
          onOpenChange={(open) => !open && setViewingBillId(null)}
        />
      )}

      {/* Cylinder Entry View Drawer */}
      {viewingEntry && (
        <CylinderViewDrawer
          entry={viewingEntry}
          open={!!viewingEntryId}
          onOpenChange={(open) => {
            if (!open) {
              setViewingEntry(null);
              setViewingEntryId(null);
            }
          }}
          hideActions={true}
        />
      )}
    </>
  );
}
