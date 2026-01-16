"use client";

import { format } from "date-fns";
import { Check, X, Download } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CylinderEntryRow } from "./cylinder-table";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { formatCurrency } from "@/lib/utils";

interface CylinderViewDrawerProps {
  entry: CylinderEntryRow | null;
  groupEntries?: CylinderEntryRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (entry: CylinderEntryRow) => void;
  hideActions?: boolean; // When true, hides all action buttons (Edit, Download, All Records)
}

export function CylinderViewDrawer({ entry, groupEntries = [], open, onOpenChange, onEdit, hideActions = false }: CylinderViewDrawerProps) {
  if (!entry) return null;

  // Get DELIVERED and RECEIVED entries from the group
  const deliveredEntries = groupEntries.filter(e => e.cylinderType === "DELIVERED");
  const receivedEntries = groupEntries.filter(e => e.cylinderType === "RECEIVED");
  
  // If no group entries provided, use the single entry
  const displayDelivered = deliveredEntries.length > 0 ? deliveredEntries : (entry.cylinderType === "DELIVERED" ? [entry] : []);
  const displayReceived = receivedEntries.length > 0 ? receivedEntries : (entry.cylinderType === "RECEIVED" ? [entry] : []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-slate-900">Cylinder Entry Details</SheetTitle>
          <SheetDescription>
            {displayDelivered.length > 0 && displayReceived.length > 0 
              ? "View complete information for both Delivered and Received entries" 
              : "View complete information about this cylinder entry"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="text-sm font-medium text-slate-500">Customer</label>
            <p className="mt-1 text-lg font-semibold text-slate-900">{entry.customerName}</p>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="text-sm font-medium text-slate-500">Delivery Date</label>
            <p className="mt-1 text-base text-slate-900">
              {entry.deliveryDate ? format(entry.deliveryDate, "MMMM d, yyyy") : "—"}
            </p>
          </div>

          {/* DELIVERED Entries */}
          {displayDelivered.map((deliveredEntry, idx) => (
            <div key={deliveredEntry.id} className="space-y-4 rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center justify-between">
                <Badge className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                  Delivered Entry {displayDelivered.length > 1 ? `#${idx + 1}` : ''}
                </Badge>
                <Badge
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    deliveredEntry.verified
                      ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52] hover:bg-[#eefaf4] hover:text-[#1f8a52]"
                      : "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
                  )}
                >
                  {deliveredEntry.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {deliveredEntry.verified ? "Verified" : "Pending"}
                </Badge>
              </div>

              {/* Cylinder Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cylinder Type</label>
                  <p className="mt-1 text-base font-medium text-slate-900">{deliveredEntry.cylinderLabel || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Quantity</label>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {deliveredEntry.quantity != null && deliveredEntry.quantity > 0 ? deliveredEntry.quantity : "—"}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-600">Unit Price</label>
                    <p className="mt-1 text-lg font-semibold text-blue-900">
                      <span className="whitespace-nowrap">{deliveredEntry.unitPrice != null && deliveredEntry.unitPrice > 0
                        ? formatCurrency(deliveredEntry.unitPrice)
                        : "—"}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-600">Total Amount</label>
                    <p className="mt-1 text-2xl font-bold text-[#2544d6]">
                      <span className="whitespace-nowrap">{deliveredEntry.amount != null && deliveredEntry.amount > 0
                        ? formatCurrency(deliveredEntry.amount)
                        : "—"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-slate-500">Bill Created By</label>
                  <p className="mt-1 text-base text-slate-900">{deliveredEntry.billCreatedBy || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Delivered By</label>
                  <p className="mt-1 text-base text-slate-900">{deliveredEntry.deliveredBy || "—"}</p>
                </div>
                {deliveredEntry.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Description</label>
                    <p className="mt-1 text-base text-slate-900">{deliveredEntry.description}</p>
                  </div>
                )}
              </div>

              {/* Edit Delivered Entry Button - appears after each Delivered Entry card */}
              {!hideActions && (
                <div className="mt-4">
                  {onEdit ? (
                    <Button
                      onClick={() => onEdit(deliveredEntry)}
                      className="w-full rounded-xl bg-[#1c5bff] hover:bg-[#1647c4]"
                    >
                      Edit Delivered Entry
                    </Button>
                  ) : (
                    <Link href={`/add-cylinder/${deliveredEntry.id}/edit`} className="w-full">
                      <Button className="w-full rounded-xl bg-[#1c5bff] hover:bg-[#1647c4]">
                        Edit Delivered Entry
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* RECEIVED Entries */}
          {displayReceived.map((receivedEntry, idx) => (
            <div key={receivedEntry.id} className="space-y-4 rounded-xl border-2 border-orange-200 bg-orange-50/30 p-4">
              <div className="flex items-center justify-between">
                <Badge className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">
                  Received Entry {displayReceived.length > 1 ? `#${idx + 1}` : ''}
                </Badge>
                <Badge
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    receivedEntry.verified
                      ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52] hover:bg-[#eefaf4] hover:text-[#1f8a52]"
                      : "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
                  )}
                >
                  {receivedEntry.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {receivedEntry.verified ? "Verified" : "Pending"}
                </Badge>
              </div>

              {/* Cylinder Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cylinder Type</label>
                  <p className="mt-1 text-base font-medium text-slate-900">{receivedEntry.cylinderLabel || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Empty Cylinders Received</label>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {receivedEntry.emptyCylinderReceived != null && receivedEntry.emptyCylinderReceived > 0
                      ? receivedEntry.emptyCylinderReceived
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-orange-600">Payment Type</label>
                    <p className="mt-1 text-base font-semibold text-orange-900">
                      {receivedEntry.paymentType && receivedEntry.paymentType !== "NONE"
                        ? receivedEntry.paymentType.charAt(0) + receivedEntry.paymentType.slice(1).toLowerCase()
                        : "None"}
                    </p>
                  </div>
                  {receivedEntry.paymentType === "CASH" && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-orange-600">Payment Amount</label>
                        <p className="mt-1 text-lg font-semibold text-orange-900">
                          {receivedEntry.paymentAmount != null && receivedEntry.paymentAmount > 0
                            ? <span className="whitespace-nowrap">{formatCurrency(receivedEntry.paymentAmount)}</span>
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-600">Payment Received By</label>
                        <p className="mt-1 text-base text-orange-900">
                          {receivedEntry.paymentReceivedBy || "—"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Received Information */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cylinder Received By</label>
                  <p className="mt-1 text-base text-slate-900">{receivedEntry.billCreatedBy || "—"}</p>
                </div>
                {receivedEntry.deliveredBy && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Delivered By</label>
                    <p className="mt-1 text-base text-slate-900">{receivedEntry.deliveredBy}</p>
                  </div>
                )}
                {receivedEntry.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Description</label>
                    <p className="mt-1 text-base text-slate-900">{receivedEntry.description}</p>
                  </div>
                )}
              </div>

              {/* Edit Received Entry Button - appears after each Received Entry card */}
              {!hideActions && (
                <div className="mt-4">
                  {onEdit ? (
                    <Button
                      onClick={() => onEdit(receivedEntry)}
                      className="w-full rounded-xl bg-orange-600 hover:bg-orange-700"
                    >
                      Edit Received Entry
                    </Button>
                  ) : (
                    <Link href={`/add-cylinder/${receivedEntry.id}/edit`} className="w-full">
                      <Button className="w-full rounded-xl bg-orange-600 hover:bg-orange-700">
                        Edit Received Entry
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Actions Section */}
          {!hideActions && (
            <div className="border-t border-slate-200 pt-6">
              {/* All Records of One Day Button */}
              {entry.deliveryDate && (
                <Link 
                  href={`/add-cylinder/daily/${format(entry.deliveryDate, "yyyy-MM-dd")}?customer=${encodeURIComponent(entry.customerName)}`} 
                  className="w-full block mb-4"
                >
                  <Button variant="outline" className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
                    All Records of One Day
                  </Button>
                </Link>
              )}
              
              {/* Download Bill Button - appears at the end */}
              {displayDelivered.length > 0 && (
                <Link href={`/add-cylinder/${displayDelivered[0].id}/download`} className="w-full block">
                  <Button variant="outline" className="w-full rounded-xl">
                    <Download className="mr-2 h-4 w-4" />
                    Download Bill
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

