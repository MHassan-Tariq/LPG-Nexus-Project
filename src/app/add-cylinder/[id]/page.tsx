import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { getCylinderEntry } from "../actions";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

interface ViewCylinderPageProps {
  params: { id: string };
}

export default async function ViewCylinderPage({ params }: ViewCylinderPageProps) {
  const result = await getCylinderEntry(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const entry = result.data;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/add-cylinder">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">Cylinder Entry Details</h1>
          </div>

          <Card className="rounded-[32px] border border-[#e5eaf4] bg-white shadow-none">
            <CardContent className="p-6 lg:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Customer</label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{entry.customerName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Type</label>
                    <div className="mt-1">
                      <Badge
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold",
                          entry.cylinderType === "DELIVERED"
                            ? "border-[#d4e6ff] bg-[#edf4ff] text-[#2554d8] hover:bg-[#edf4ff] hover:text-[#2554d8]"
                            : "border-[#d9e5ff] bg-[#f0f4ff] text-[#1c5bff] hover:bg-[#f0f4ff] hover:text-[#1c5bff]",
                        )}
                      >
                        {entry.cylinderType === "DELIVERED" ? "Delivered" : "Received"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Cylinder Type</label>
                    <p className="mt-1 text-lg text-slate-900">{entry.cylinderLabel ?? "—"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Quantity</label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{entry.quantity}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Unit Price</label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {currencyFormatter.format(entry.unitPrice)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Total Amount</label>
                    <p className="mt-1 text-2xl font-bold text-[#2544d6]">
                      {currencyFormatter.format(entry.amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Bill Created By</label>
                    <p className="mt-1 text-lg text-slate-900">{entry.billCreatedBy}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Delivered By</label>
                    <p className="mt-1 text-lg text-slate-900">{entry.deliveredBy ?? "—"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Delivery Date</label>
                    <p className="mt-1 text-lg text-slate-900">
                      {entry.deliveryDate ? format(entry.deliveryDate, "MMMM d, yyyy") : "—"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Verified Status</label>
                    <div className="mt-1">
                      <Badge
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold",
                          entry.verified
                            ? "border-[#cfe9dd] bg-[#eefaf4] text-[#1f8a52] hover:bg-[#eefaf4] hover:text-[#1f8a52]"
                            : "bg-[#0f172a] text-white hover:bg-[#0f172a] hover:text-white",
                        )}
                      >
                        {entry.verified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {entry.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Description</label>
                    <p className="mt-1 text-lg text-slate-900">{entry.description || "—"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-500">Created At</label>
                    <p className="mt-1 text-lg text-slate-900">
                      {format(entry.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 border-t border-slate-100 pt-6">
                <Link href={`/add-cylinder/${params.id}/edit`}>
                  <Button className="rounded-xl bg-[#1c5bff] hover:bg-[#1647c4]">
                    Edit Entry
                  </Button>
                </Link>
                <Link href={`/add-cylinder/${params.id}/download`}>
                  <Button variant="outline" className="rounded-xl">
                    Download Bill
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

