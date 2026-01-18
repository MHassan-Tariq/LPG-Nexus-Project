"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Eye, Printer, Trash2, Receipt, Loader2 } from "lucide-react";

import type { BillStatus } from "@prisma/client";
import { deleteBillAction } from "@/app/(dashboard)/payments/actions";
import { BillStatusBadge } from "@/components/payments/bill-status-badge";
import { BillViewDrawer } from "@/components/payments/bill-view-drawer";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

import { formatNumber, formatCurrency } from "@/lib/utils";

export interface PaymentRecordRow {
  id: string;
  code: string;
  name: string;
  lastMonthRemaining: number;
  currentMonthBill: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BillStatus;
  billStartDate: Date;
  billEndDate: Date;
  cylinders: number;
  invoice?: {
    id: string;
    invoiceNumber: string;
    generatedAt: Date;
  } | null;
}

interface PaymentTableProps {
  records: PaymentRecordRow[];
}

export function PaymentRecordsTable({ records }: PaymentTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PaymentRecordRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!id) {
      alert("Invalid bill ID. Please try again.");
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      try {
        const result = await deleteBillAction(id);
        if (result.success) {
          if (selected?.id === id) {
            setSelected(null);
          }
          router.refresh();
        } else {
          alert(result.error || "Failed to delete bill. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting bill:", error);
        alert(`Failed to delete bill: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setDeletingId(null);
      }
    });
  }

  function handleDownloadBill(id: string) {
    setDownloadingId(id);
    // Navigate to preview page with download button
    window.location.href = `/payments/${id}/download`;
    setTimeout(() => setDownloadingId(null), 2000);
  }

  async function handlePrintBill(id: string) {
    setPrintingId(id);
    // Directly download the PDF
    try {
      const response = await fetch(`/api/payments/${id}/bill`);
      if (!response.ok) {
        throw new Error("Failed to download bill");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || `bill-${id}.pdf`
        : `bill-${id}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download bill. Please try again.");
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <>
      {isPending ? (
        <div className="p-6">
          <TableSkeleton rows={10} columns={10} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide text-slate-400">
                <TableHead className="text-center">ID</TableHead>
                <TableHead className="text-center">Name</TableHead>
                <TableHead className="text-center">Last Month Remaining</TableHead>
                <TableHead className="text-center">Current Month Bill</TableHead>
                <TableHead className="text-center">Total Amount</TableHead>
                <TableHead className="text-center">Paid Amount</TableHead>
                <TableHead className="text-center">Remaining Amount</TableHead>
                <TableHead className="text-center">Cylinders</TableHead>
                <TableHead className="text-center">Bill Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-500">
                    No payment records match your filters.
                  </TableCell>
                </TableRow>
              )}
              {records.map((record) => (
                <TableRow key={record.id} className="text-sm">
                  <TableCell className="whitespace-nowrap text-center font-semibold text-slate-900">{record.code}</TableCell>
                  <TableCell className="whitespace-nowrap text-center text-slate-700">{record.name}</TableCell>
                  <TableCell className="text-center text-slate-500 whitespace-nowrap">{formatCurrency(record.lastMonthRemaining)}</TableCell>
                  <TableCell className="text-center text-slate-500 whitespace-nowrap">{formatCurrency(record.currentMonthBill)}</TableCell>
                  <TableCell className="text-center font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(record.totalAmount)}</TableCell>
                  <TableCell className="text-center text-emerald-600 whitespace-nowrap">{formatCurrency(record.paidAmount)}</TableCell>
                  <TableCell className="text-center text-rose-500 whitespace-nowrap">{formatCurrency(record.remainingAmount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-center font-semibold text-slate-700">{record.cylinders}</TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <BillStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <TooltipProvider delayDuration={80}>
                      <div className="flex flex-nowrap items-center justify-center gap-2">
                        <ActionIcon 
                          icon={printingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} 
                          label="Print Bill" 
                          onClick={() => handlePrintBill(record.id)}
                          disabled={printingId === record.id}
                        />
                        <ActionIcon 
                          icon={downloadingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                          label="Download Bill" 
                          onClick={() => handleDownloadBill(record.id)}
                          disabled={downloadingId === record.id}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href="/payments/invoices">
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3fb] text-slate-600 text-sm transition hover:bg-[#e4e8f5]"
                                aria-label="View / Generate Invoice"
                              >
                                <Receipt className="h-4 w-4" />
                              </button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-900 text-white">
                            View / Generate Invoice
                          </TooltipContent>
                        </Tooltip>
                        <ActionIcon 
                          icon={viewingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} 
                          label="View Payments" 
                          onClick={() => {
                            setViewingId(record.id);
                            setSelected(record);
                            setTimeout(() => setViewingId(null), 500);
                          }}
                          disabled={viewingId === record.id}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={deletingId === record.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/90 text-white transition hover:bg-rose-500 disabled:opacity-50"
                              aria-label="Delete"
                            >
                              {deletingId === record.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the bill for {record.name} (Bill ID: {record.code})? This will also delete all associated payments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BillViewDrawer
        billId={selected?.id || ""}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        initialData={selected ? {
          code: selected.code,
          name: selected.name,
          totalAmount: selected.totalAmount,
          paidAmount: selected.paidAmount,
          remainingAmount: selected.remainingAmount,
          status: selected.status,
          billStartDate: selected.billStartDate,
          billEndDate: selected.billEndDate,
          cylinders: selected.cylinders,
          invoice: selected.invoice || null,
        } : undefined}
      />
    </>
  );
}


function ActionIcon({
  icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  tone?: "default" | "destructive";
  disabled?: boolean;
}) {
  const base =
    tone === "destructive"
      ? "bg-rose-500/90 text-white hover:bg-rose-500"
      : "bg-[#f1f3fb] text-slate-600 hover:bg-[#e4e8f5]";

  const content =
    tone === "destructive"
      ? "bg-[#d92c3a] text-white"
      : "bg-slate-900 text-white";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${base} disabled:opacity-50`}
          aria-label={label}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className={`rounded-full px-3 py-1 text-xs font-semibold ${content}`}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

