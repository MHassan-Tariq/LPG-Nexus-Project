"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download as DownloadIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillPreview } from "./bill-preview";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface BillDownloadPageClientProps {
  bill: {
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
    payments: Array<{
      id: string;
      amount: number;
      paidOn: Date;
      method: string | null;
      notes: string | null;
    }>;
  };
}

export function BillDownloadPageClient({ bill }: BillDownloadPageClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/payments/${bill.id}/bill`);
      if (!response.ok) {
        throw new Error("Failed to download bill");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bill-${bill.customer.name.replace(/\s+/g, "-")}-${format(bill.billStartDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download bill. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleSaveDesign() {
    router.push("/settings?tab=bill-designing");
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Payment Bill</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveDesign}
            variant="outline"
            className="rounded-xl border-slate-300 hover:bg-slate-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Save Design
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="rounded-xl bg-[#1c5bff] hover:bg-[#1647c4]"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download Bill (PDF)"}
          </Button>
        </div>
      </div>

      <BillPreview bill={bill} />
    </>
  );
}

