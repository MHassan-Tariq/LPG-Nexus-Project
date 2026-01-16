"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download as DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CylinderEntryRow } from "./cylinder-table";
import { CylinderViewDrawer } from "./cylinder-view-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

interface DailyRecordsClientProps {
  entries: CylinderEntryRow[];
  date: Date;
  customerName?: string | null;
}

export function DailyRecordsClient({ entries, date, customerName }: DailyRecordsClientProps) {
  const [selectedEntry, setSelectedEntry] = useState<CylinderEntryRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Group entries by customer
  const entriesByCustomer = entries.reduce((acc, entry) => {
    const key = entry.customerName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, CylinderEntryRow[]>);

  const handleView = (entry: CylinderEntryRow) => {
    // Get all entries for the same date and customer
    const groupEntries = entries.filter(
      (e) =>
        e.customerName === entry.customerName &&
        format(e.deliveryDate, "yyyy-MM-dd") === format(entry.deliveryDate, "yyyy-MM-dd")
    );
    setSelectedEntry(entry);
    setIsDrawerOpen(true);
  };

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      // Include customer filter in URL if customer is specified
      const customerParam = customerName 
        ? `?customer=${encodeURIComponent(customerName)}`
        : "";
      const response = await fetch(`/api/add-cylinder/daily/${dateStr}/bill${customerParam}`);
      if (!response.ok) {
        throw new Error("Failed to download daily bill");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = customerName 
        ? `daily-bill-${customerName.replace(/\s+/g, "-")}-${dateStr}.pdf`
        : `daily-bill-${dateStr}.pdf`;
      link.download = fileName;
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

  // Calculate totals
  const totalDelivered = entries
    .filter((e) => e.cylinderType === "DELIVERED")
    .reduce((sum, e) => sum + (e.quantity || 0), 0);
  const totalReceived = entries
    .filter((e) => e.cylinderType === "RECEIVED")
    .reduce((sum, e) => sum + (e.emptyCylinderReceived || e.quantity || 0), 0);
  const totalAmount = entries
    .filter((e) => e.cylinderType === "DELIVERED")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <>
      <div className="flex items-center gap-4">
        <Link href="/add-cylinder">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {customerName 
              ? `All Records for ${customerName} - ${format(date, "MMMM d, yyyy")}`
              : `All Records for ${format(date, "MMMM d, yyyy")}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} found
            {customerName && ` for ${customerName}`}
          </p>
        </div>
      </div>

      {/* Download Daily Bill Button - on top of cards */}
      <div className="flex justify-end">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || entries.length === 0}
          className="rounded-xl bg-[#1c5bff] hover:bg-[#1647c4]"
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download Daily Bill"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500">Total Delivered</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{totalDelivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500">Total Received</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{totalReceived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {currencyFormatter.format(totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries grouped by customer */}
      <div className="space-y-6">
        {Object.entries(entriesByCustomer).map(([customerName, customerEntries]) => (
          <div key={customerName} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">{customerName}</h2>
                </div>
                <div className="space-y-4">
                  {customerEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "rounded-lg border-2 p-4 cursor-pointer hover:shadow-md transition-shadow",
                        entry.cylinderType === "DELIVERED"
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-orange-200 bg-orange-50/30"
                      )}
                      onClick={() => handleView(entry)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                            entry.cylinderType === "DELIVERED"
                              ? "border-blue-200 bg-blue-100 text-blue-700"
                              : "border-orange-200 bg-orange-100 text-orange-700"
                          )}
                        >
                          {entry.cylinderType === "DELIVERED" ? "Delivered" : "Received"}
                        </Badge>
                        <Badge
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                            entry.verified
                              ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52]"
                              : "bg-[#0f172a] text-white"
                          )}
                        >
                          {entry.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {entry.verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500">Cylinder Type</label>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {entry.cylinderLabel || "—"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500">
                            {entry.cylinderType === "DELIVERED" ? "Quantity" : "Empty Received"}
                          </label>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {entry.cylinderType === "DELIVERED"
                              ? entry.quantity || 0
                              : entry.emptyCylinderReceived || entry.quantity || 0}
                          </p>
                        </div>
                        {entry.cylinderType === "DELIVERED" && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-slate-500">Unit Price</label>
                              <p className="mt-1 text-sm font-medium text-slate-900">
                                {entry.unitPrice
                                  ? currencyFormatter.format(entry.unitPrice)
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500">Total Amount</label>
                              <p className="mt-1 text-sm font-semibold text-blue-600">
                                {entry.amount ? currencyFormatter.format(entry.amount) : "—"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {selectedEntry && (
        <CylinderViewDrawer
          entry={selectedEntry}
          groupEntries={entries.filter(
            (e) =>
              e.customerName === selectedEntry.customerName &&
              format(e.deliveryDate, "yyyy-MM-dd") === format(selectedEntry.deliveryDate, "yyyy-MM-dd")
          )}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      )}
    </>
  );
}
