"use client";

import { format } from "date-fns";
import { Eye } from "lucide-react";
import { useState } from "react";

import { PaymentEventType } from "@prisma/client";
import { PaymentEventBadge } from "@/components/payment-logs/event-type-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { formatCurrency } from "@/lib/utils";

export interface PaymentLogItem {
  id: string;
  billId: string | null;
  customerName: string;
  customerCode: number | null;
  billStartDate: Date | null;
  billEndDate: Date | null;
  amount: number | null;
  performedAt: Date;
  eventType: PaymentEventType;
  details: string | null;
}

export function PaymentLogsTable({ logs }: { logs: PaymentLogItem[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerLogs, setCustomerLogs] = useState<PaymentLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  async function handleView(log: PaymentLogItem) {
    console.log("handleView called with log:", log);
    setIsLoading(true);
    setIsSheetOpen(true);
    setSelectedCustomer(log.customerName);

    try {
      const response = await fetch(`/api/payment-logs/customer?customerName=${encodeURIComponent(log.customerName)}`);
      console.log("API response status:", response.status);
      if (response.ok) {
        const result = await response.json();
        console.log("API result:", result);
        const formattedLogs: PaymentLogItem[] = result.data.map((logItem: any) => ({
          id: logItem.id,
          billId: logItem.billId,
          customerName: logItem.customerName,
          customerCode: logItem.customerCode ?? null,
          billStartDate: logItem.billStartDate ? new Date(logItem.billStartDate) : null,
          billEndDate: logItem.billEndDate ? new Date(logItem.billEndDate) : null,
          amount: logItem.amount,
          performedAt: new Date(logItem.performedAt),
          eventType: logItem.eventType,
          details: logItem.details,
        }));
        setCustomerLogs(formattedLogs);
      } else {
        const errorText = await response.text();
        console.error("API error:", errorText);
        setCustomerLogs([]);
      }
    } catch (error) {
      console.error("Error fetching customer payment logs:", error);
      setCustomerLogs([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setSelectedCustomer(null);
      setCustomerLogs([]);
    }
    setIsSheetOpen(open);
  }

  async function handleViewBill(log: PaymentLogItem) {
    if (!log.billId) {
      console.warn("No billId available for this log entry");
      return;
    }
    
    // Check if bill exists before opening
    try {
      const response = await fetch(`/api/bills/${log.billId}/exists`);
      if (response.ok) {
        const result = await response.json();
        if (result.exists) {
          window.open(`/payments/${log.billId}/download`, '_blank');
        } else {
          alert("This bill has been deleted and is no longer available.");
        }
      } else {
        // If API doesn't exist, try opening anyway
        window.open(`/payments/${log.billId}/download`, '_blank');
      }
    } catch (error) {
      console.error("Error checking bill existence:", error);
      // If check fails, try opening anyway
      window.open(`/payments/${log.billId}/download`, '_blank');
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-wide text-slate-400">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Bill Start Date</TableHead>
              <TableHead>Bill End Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Performed At</TableHead>
              <TableHead className="whitespace-nowrap">Event Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                  No payment logs found. Run billing actions to generate entries.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id} className="text-sm">
                <TableCell className="font-medium text-slate-900">
                  {log.customerCode ?? "—"}
                </TableCell>
                <TableCell className="font-medium text-slate-900">{log.customerName}</TableCell>
                <TableCell className="text-slate-600">
                  {log.billStartDate ? format(log.billStartDate, "dd-MM-yy") : "—"}
                </TableCell>
                <TableCell className="text-slate-600">
                  {log.billEndDate ? format(log.billEndDate, "dd-MM-yy") : "—"}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  <span className="whitespace-nowrap">{log.amount != null ? formatCurrency(log.amount) : "—"}</span>
                </TableCell>
                <TableCell className="text-slate-600">{format(log.performedAt, "dd-MM-yy hh:mm a")}</TableCell>
                <TableCell>
                  <PaymentEventBadge type={log.eventType} />
                </TableCell>
                <TableCell className="text-slate-500">
                  {log.details
                    ? log.details.length > 15
                      ? `${log.details.slice(0, 15)}…`
                      : log.details
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    aria-label="View customer payment logs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleView(log);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Payment Logs - {selectedCustomer}</SheetTitle>
            <SheetDescription>
              All payment transactions and billing history for this customer
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">Loading payment logs...</p>
              </div>
            ) : customerLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">No payment logs found for this customer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <PaymentEventBadge type={log.eventType} />
                          <span className="text-sm font-semibold text-slate-900">
                            <span className="whitespace-nowrap">{formatCurrency(log.amount ?? 0)}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {log.billStartDate && (
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Bill Start Date</label>
                              <p className="mt-1 text-slate-900">
                                {format(log.billStartDate, "dd-MM-yyyy")}
                              </p>
                            </div>
                          )}
                          {log.billEndDate && (
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Bill End Date</label>
                              <p className="mt-1 text-slate-900">
                                {format(log.billEndDate, "dd-MM-yyyy")}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Performed At</label>
                            <p className="mt-1 text-slate-900">
                              {format(log.performedAt, "dd-MM-yyyy hh:mm a")}
                            </p>
                          </div>
                        </div>
                        {log.details && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Details</label>
                            <p className="mt-1 text-sm text-slate-700">{log.details}</p>
                          </div>
                        )}
                      </div>
                      {log.billId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-4"
                          onClick={() => handleViewBill(log)}
                          disabled={log.eventType === "BILL_DELETED"}
                        >
                          {log.eventType === "BILL_DELETED" ? "Bill Deleted" : "View Bill"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

