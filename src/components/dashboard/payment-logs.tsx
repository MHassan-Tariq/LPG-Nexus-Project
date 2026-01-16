"use client";

import { PaymentEventType } from "@prisma/client";
import { Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

import { PaymentEventBadge } from "@/components/payment-logs/event-type-badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export type PaymentLog = {
  id: string;
  name: string;
  billStartDate: string;
  billEndDate: string;
  amount: string;
  performedAt: string;
  eventType: PaymentEventType;
  details: string;
};

interface PaymentLogsProps {
  logs: PaymentLog[];
}

const currency = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 });

interface CustomerLogItem {
  id: string;
  billId: string | null;
  customerName: string;
  billStartDate: Date | null;
  billEndDate: Date | null;
  amount: number | null;
  performedAt: Date;
  eventType: PaymentEventType;
  details: string | null;
}

export function PaymentLogsTable({ logs }: PaymentLogsProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerLogs, setCustomerLogs] = useState<CustomerLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  async function handleView(log: PaymentLog) {
    setIsLoading(true);
    setIsSheetOpen(true);
    setSelectedCustomer(log.name);

    try {
      const response = await fetch(`/api/payment-logs/customer?customerName=${encodeURIComponent(log.name)}`);
      if (response.ok) {
        const result = await response.json();
        const formattedLogs: CustomerLogItem[] = result.data.map((logItem: any) => ({
          id: logItem.id,
          billId: logItem.billId,
          customerName: logItem.customerName,
          billStartDate: logItem.billStartDate ? new Date(logItem.billStartDate) : null,
          billEndDate: logItem.billEndDate ? new Date(logItem.billEndDate) : null,
          amount: logItem.amount,
          performedAt: new Date(logItem.performedAt),
          eventType: logItem.eventType,
          details: logItem.details,
        }));
        setCustomerLogs(formattedLogs);
      } else {
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

  return (
    <>
      <Card className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Recent Payment Logs</h3>
          <p className="text-sm text-slate-500">Latest payment transactions</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-slate-500">
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
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    No payment logs found. Payment transactions will appear here once you start receiving payments.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell className="font-medium text-slate-900">{log.name}</TableCell>
                    <TableCell>{log.billStartDate}</TableCell>
                    <TableCell>{log.billEndDate}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{log.amount}</TableCell>
                    <TableCell>{log.performedAt}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
                            {currency.format(log.amount ?? 0)}
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
                          onClick={() => window.open(`/payments/${log.billId}/download`, '_blank')}
                        >
                          View Bill
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
