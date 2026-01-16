"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { Receipt, Download, Trash2, FileCheck, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "PKR", maximumFractionDigits: 0 });

export interface BillWithInvoice {
  id: string;
  code: string;
  name: string;
  billStartDate: Date;
  billEndDate: Date;
  totalAmount: number;
  invoice?: {
    id: string;
    invoiceNumber: string;
    generatedAt: Date;
  } | null;
}

interface InvoiceManagementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: BillWithInvoice[];
  onSuccess?: () => void;
}

export function InvoiceManagementDrawer({
  open,
  onOpenChange,
  bills,
  onSuccess,
}: InvoiceManagementDrawerProps) {
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reset selection when drawer closes
  useEffect(() => {
    if (!open) {
      setSelectedBillIds(new Set());
      setStatusMessage(null);
    }
  }, [open]);

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
          // Refresh parent data to get updated invoice information
          onSuccess?.();
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
        // Refresh parent data
        onSuccess?.();
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
        // Delete all invoices in parallel
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
        // Refresh parent data
        onSuccess?.();
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoice Manager
          </SheetTitle>
          <SheetDescription>
            Generate, download, or delete invoices for selected bills. Each bill can only have one invoice.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pb-4 border-b">
            <div className="text-sm text-slate-600">
              <strong>Selected:</strong> {selectedBillIds.size} bill(s)
              {billsWithInvoices.length > 0 && (
                <span className="ml-2">
                  ({billsWithInvoices.length} with invoices, {billsWithoutInvoices.length} without)
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateInvoices}
                disabled={isPending || billsWithoutInvoices.length === 0}
                className="w-full"
              >
                <Receipt className="mr-2 h-4 w-4" />
                {isPending ? "Generating..." : `Generate Invoice${billsWithoutInvoices.length !== 1 ? "s" : ""}`}
              </Button>
              
              {billsWithInvoices.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      billsWithInvoices.forEach((bill) => {
                        if (bill.invoice) {
                          handleDownloadInvoice(bill.invoice.invoiceNumber);
                        }
                      });
                    }}
                    disabled={isPending}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download All ({billsWithInvoices.length})
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isPending}
                        className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All ({billsWithInvoices.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Invoices</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete all {billsWithInvoices.length} selected invoice(s)? 
                          This will allow you to generate new invoices for these bills. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAllInvoices}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {billsWithoutInvoices.length > 0 && billsWithInvoices.length > 0 && (
              <p className="text-xs text-slate-500">
                Note: Only bills without invoices can be generated. Bills with existing invoices can be downloaded or deleted.
              </p>
            )}
          </div>

          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-3 border-b">
            <Checkbox
              id="select-all"
              checked={selectedBillIds.size === bills.length && bills.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All ({selectedBillIds.size} selected)
            </label>
          </div>

          {/* Bills Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Invoice Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      No bills available.
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBillIds.has(bill.id)}
                          onCheckedChange={() => handleToggleBill(bill.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{bill.code}</TableCell>
                      <TableCell>{bill.name}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(bill.billStartDate, "MMM d")} - {format(bill.billEndDate, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currency.format(bill.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {bill.invoice ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <FileCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">{bill.invoice.invoiceNumber}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <FileX className="h-4 w-4" />
                            <span className="text-xs">Not generated</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bill.invoice ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(bill.invoice!.invoiceNumber)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice {bill.invoice!.invoiceNumber}? 
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
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
