"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download as DownloadIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CylinderBillPreview } from "./cylinder-bill-preview";
import { format } from "date-fns";

interface CylinderDownloadPageClientProps {
  entry: {
    id: string;
    billCreatedBy: string;
    cylinderType: "DELIVERED" | "RECEIVED";
    cylinderLabel?: string | null;
    deliveredBy?: string | null;
    quantity: number;
    unitPrice: number;
    amount: number;
    customerName: string;
    customerId?: string | null;
    verified: boolean;
    description?: string | null;
    deliveryDate: Date;
    createdAt: Date;
    // RECEIVED type fields
    paymentType?: string | null;
    paymentAmount?: number | null;
    paymentReceivedBy?: string | null;
    emptyCylinderReceived?: number | null;
    // Customer details
    customerAddress?: string | null;
    customerPhone?: string | null;
  };
}

export function CylinderDownloadPageClient({ entry }: CylinderDownloadPageClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  
  // Get current page URL to return to after saving design
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/add-cylinder';

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/add-cylinder/${entry.id}/bill`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download error response:", errorText);
        throw new Error(`Failed to download bill: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Check if the response is actually a PDF
      if (blob.type !== "application/pdf" && blob.size === 0) {
        throw new Error("Invalid PDF response from server");
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cylinder-bill-${entry.customerName.replace(/\s+/g, "-")}-${format(entry.deliveryDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download bill. ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleSaveDesign() {
    // Pass return URL so we can redirect back after saving
    const returnUrl = encodeURIComponent(currentPath);
    router.push(`/settings?tab=bill-designing&returnUrl=${returnUrl}`);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/add-cylinder">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Cylinder Bill</h1>
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

      <CylinderBillPreview entry={entry} />
    </>
  );
}

