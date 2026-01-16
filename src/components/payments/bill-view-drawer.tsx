"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { Download, Package, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { BillStatusBadge } from "@/components/payments/bill-status-badge";
import { AddPaymentDrawer } from "@/components/payments/add-payment-drawer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBillAction } from "@/app/payments/actions";
import { deletePaymentAction } from "@/app/payments/actions";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

interface Payment {
  id: string;
  amount: number;
  paidOn: Date;
  method: string | null;
  notes: string | null;
}

interface BillData {
  id: string;
  customer: {
    name: string;
    customerCode: number;
  };
  billStartDate: Date;
  billEndDate: Date;
  lastMonthRemaining: number;
  currentMonthBill: number;
  cylinders: number;
  status: string;
  payments: Payment[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    generatedAt: Date;
  } | null;
}

interface BillViewDrawerProps {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    code: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    billStartDate: Date;
    billEndDate: Date;
    cylinders: number;
    invoice?: {
      id: string;
      invoiceNumber: string;
      generatedAt: Date;
    } | null;
  };
}

export function BillViewDrawer({
  billId,
  open,
  onOpenChange,
  initialData,
}: BillViewDrawerProps) {
  const router = useRouter();
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSourceEntries, setShowSourceEntries] = useState(false);
  const [sourceEntries, setSourceEntries] = useState<any[]>([]);
  const [loadingSourceEntries, setLoadingSourceEntries] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && billId) {
      loadBillData();
    } else {
      setBillData(null);
    }
  }, [open, billId]);

  async function loadBillData() {
    setIsLoading(true);
    try {
      const result = await getBillAction(billId);
      if (result.success && result.data) {
        setBillData(result.data);
      }
    } catch (error) {
      console.error("Error loading bill:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSourceEntries() {
    if (!billData) return;
    setLoadingSourceEntries(true);
    try {
      const response = await fetch(
        `/api/payments/${billId}/source-entries?customerId=${billData.customer.customerCode}&from=${billData.billStartDate.toISOString()}&to=${billData.billEndDate.toISOString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setSourceEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error loading source entries:", error);
    } finally {
      setLoadingSourceEntries(false);
    }
  }

  function handleViewSourceEntries() {
    setShowSourceEntries(true);
    if (sourceEntries.length === 0) {
      loadSourceEntries();
    }
  }

  function handleDeletePayment(paymentId: string) {
    setDeletingPaymentId(paymentId);
    startTransition(async () => {
      try {
        const result = await deletePaymentAction(paymentId);
        if (result.success) {
          await loadBillData(); // Reload bill data
          router.refresh();
        } else {
          alert(result.error || "Failed to delete payment");
        }
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert("Failed to delete payment");
      } finally {
        setDeletingPaymentId(null);
      }
    });
  }

  function handlePaymentSuccess() {
    loadBillData();
    router.refresh();
  }

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading bill details...</span>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!billData && !initialData) {
    return null;
  }

  const data = billData
    ? (() => {
        const totalAmount = billData.lastMonthRemaining + billData.currentMonthBill;
        const paidAmount = billData.payments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = Math.max(totalAmount - paidAmount, 0);
        // Calculate status dynamically based on remaining amount
        const computedStatus =
          remainingAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "NOT_PAID";
        
        return {
          code: String(billData.customer.customerCode),
          name: billData.customer.name,
          totalAmount,
          paidAmount,
          remainingAmount,
          status: computedStatus,
          billStartDate: billData.billStartDate,
          billEndDate: billData.billEndDate,
          cylinders: billData.cylinders,
          invoice: billData.invoice,
        };
      })()
    : initialData!;

  const payments = billData?.payments || [];
  const hasInvoice = !!data.invoice;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bill Details — {data.code}</SheetTitle>
            <SheetDescription>Complete bill information and payment history</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Bill Summary */}
            <div className="space-y-4 text-sm">
              <DetailRow label="Customer">{data.name}</DetailRow>
              <DetailRow label="Billing Period">
                {format(data.billStartDate, "MMM d, yyyy")} – {format(data.billEndDate, "MMM d, yyyy")}
              </DetailRow>
              <DetailRow label="Last Month Remaining">
                {currency.format(billData?.lastMonthRemaining || 0)}
              </DetailRow>
              <DetailRow label="Current Month Bill">
                {currency.format(billData?.currentMonthBill || 0)}
              </DetailRow>
              <DetailRow label="Total Amount" strong>
                {currency.format(data.totalAmount)}
              </DetailRow>
              <DetailRow label="Paid Amount" strong>
                <span className="text-emerald-600">{currency.format(data.paidAmount)}</span>
              </DetailRow>
              <DetailRow label="Remaining Amount" strong>
                <span className="text-rose-600">{currency.format(data.remainingAmount)}</span>
              </DetailRow>
              <DetailRow label="Cylinders">{data.cylinders}</DetailRow>
              <DetailRow label="Status">
                <BillStatusBadge status={data.status as any} />
              </DetailRow>
            </div>

            {/* Source Entries Button */}
            <div className="pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleViewSourceEntries}
                className="w-full h-10"
              >
                <Package className="mr-2 h-4 w-4" />
                View Source Deliveries ({data.cylinders} entries)
              </Button>
            </div>

            {/* Payments Section */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Payments</h3>
                {!hasInvoice && data.remainingAmount > 0 && (
                  <AddPaymentDrawer
                    billId={billId}
                    billTotal={data.totalAmount}
                    billPaid={data.paidAmount}
                    billRemaining={data.remainingAmount}
                    customerName={data.name}
                    onSuccess={handlePaymentSuccess}
                  />
                )}
              </div>

              {hasInvoice && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <strong>Locked:</strong> This bill has an invoice generated. Payments cannot be added or deleted.
                </div>
              )}

              {payments.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Date</TableHead>
                        <TableHead className="text-center">Amount</TableHead>
                        <TableHead className="text-center">Method</TableHead>
                        <TableHead className="text-center">Notes</TableHead>
                        {!hasInvoice && <TableHead className="text-center">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments
                        .sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
                        .map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-center">
                              {format(new Date(payment.paidOn), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-emerald-600">
                              {currency.format(payment.amount)}
                            </TableCell>
                            <TableCell className="text-center capitalize">
                              {payment.method?.replace("_", " ") || "—"}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">
                              {payment.notes || "—"}
                            </TableCell>
                            {!hasInvoice && (
                              <TableCell className="text-center">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      disabled={deletingPaymentId === payment.id}
                                    >
                                      {deletingPaymentId === payment.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this payment of {currency.format(payment.amount)}?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/payments/${billId}/download`, "_blank")}
                className="flex-1 h-12"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Bill
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Source Entries Dialog */}
      <Dialog open={showSourceEntries} onOpenChange={setShowSourceEntries}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Source Deliveries</DialogTitle>
            <DialogDescription>
              Cylinder deliveries that contributed to this bill ({data.cylinders} total)
            </DialogDescription>
          </DialogHeader>
          {loadingSourceEntries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading deliveries...</span>
            </div>
          ) : sourceEntries.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">No deliveries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-center">Unit Price</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Cylinder Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceEntries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center">
                        {format(new Date(entry.deliveryDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">{entry.quantity}</TableCell>
                      <TableCell className="text-center">{currency.format(entry.unitPrice || 0)}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {currency.format(entry.amount)}
                      </TableCell>
                      <TableCell className="text-center">{entry.cylinderLabel || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({
  label,
  children,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>
        {children}
      </span>
    </div>
  );
}
