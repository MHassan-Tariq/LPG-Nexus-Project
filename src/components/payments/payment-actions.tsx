"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

async function downloadPdf(path: string, filename: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Unable to generate PDF");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

interface PaymentActionsBarProps {
  from: Date;
  to: Date;
}

export function PaymentActionsBar({ from, to }: PaymentActionsBarProps) {
  const [reportPending, startReport] = useTransition();
  const [resyncPending, startResync] = useTransition();
  const [regeneratePending, startRegenerate] = useTransition();
  const router = useRouter();

  async function handleResyncBills() {
    startResync(async () => {
      try {
        const response = await fetch("/api/bills/resync");
        const result = await response.json();

        if (result.success) {
          toast.success(
            `Bills resynced successfully! Created: ${result.stats.billsCreated}, Updated: ${result.stats.billsUpdated}`,
            {
              duration: 5000,
            }
          );
          // Refresh the page to show updated data
          router.refresh();
        } else {
          toast.error(result.error || "Failed to resync bills");
        }
      } catch (error) {
        console.error("Error resyncing bills:", error);
        toast.error("Failed to resync bills. Please try again.");
      }
    });
  }

  async function handleRegenerateBills() {
    startRegenerate(async () => {
      try {
        const response = await fetch("/api/bills/regenerate", {
          method: "POST",
        });
        const result = await response.json();

        if (result.success) {
          toast.success(
            `Bills regenerated successfully! Deleted: ${result.stats.billsDeleted}, Created: ${result.stats.billsCreated}`,
            {
              duration: 5000,
            }
          );
          // Refresh the page to show updated data
          router.refresh();
        } else {
          toast.error(result.error || "Failed to regenerate bills");
        }
      } catch (error) {
        console.error("Error regenerating bills:", error);
        toast.error("Failed to regenerate bills. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-4 rounded-[24px] border border-transparent px-1">
      <ActionButton
        label="Resync All Bills"
        loading={resyncPending}
        icon={<RefreshCw className="h-4 w-4" />}
        onClick={handleResyncBills}
        variant="secondary"
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={regeneratePending}
            className="inline-flex h-12 items-center gap-2 rounded-[16px] bg-red-600 px-6 text-sm font-semibold text-white shadow-lg hover:bg-red-700 disabled:opacity-70"
          >
            {regeneratePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Regenerate All Bills
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate All Bills</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete ALL existing bills and regenerate them from scratch based on current cylinder entries.
              <br />
              <br />
              <strong>Warning:</strong> This action cannot be undone. All existing bills will be permanently deleted.
              <br />
              <br />
              Payments associated with bills will be preserved, but bills will be recreated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateBills}
              className="bg-red-600 hover:bg-red-700"
              disabled={regeneratePending}
            >
              {regeneratePending ? "Regenerating..." : "Yes, Regenerate All Bills"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ActionButton
        label="Generate PDF Report"
        loading={reportPending}
        icon={<FileText className="h-4 w-4" />}
        onClick={() =>
          startReport(async () => {
            await downloadPdf("/api/reports/pdf", "payments-report.pdf");
          })
        }
      />
    </div>
  );
}

function ActionButton({
  label,
  loading,
  onClick,
  icon,
  variant = "primary",
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const baseClasses = "inline-flex h-12 items-center gap-2 rounded-[16px] px-6 text-sm font-semibold shadow-lg disabled:opacity-70";
  const variantClasses =
    variant === "secondary"
      ? "bg-slate-600 text-white hover:bg-slate-700"
      : "bg-[#5b55eb] text-white hover:bg-[#443ecd]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

