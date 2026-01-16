import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { CylinderForm } from "@/components/add-cylinder/cylinder-form";
import { getCylinderEntry, updateCylinderEntry } from "../../actions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CylinderFormValues } from "@/components/add-cylinder/cylinder-form";

interface EditCylinderPageProps {
  params: { id: string };
}

export default async function EditCylinderPage({ params }: EditCylinderPageProps) {
  const result = await getCylinderEntry(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const entry = result.data;
  const customers = await prisma.customer.findMany({
    orderBy: { customerCode: "asc" },
    select: {
      id: true,
      customerCode: true,
      name: true,
    },
  });

  async function handleSubmit(values: CylinderFormValues) {
    "use server";
    try {
      const result = await updateCylinderEntry(params.id, values);
      if (!result.success) {
        throw new Error(result.error || "Failed to update cylinder entry");
      }
      redirect(`/add-cylinder`);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      throw error;
    }
  }

  // Convert entry to form values
  const initialValues: CylinderFormValues = {
    billCreatedBy: entry.billCreatedBy,
    cylinderType: entry.cylinderType,
    cylinderLabel: entry.cylinderLabel ?? "",
    deliveredBy: entry.deliveredBy ?? "",
    quantity: entry.quantity,
    unitPrice: entry.cylinderType === "RECEIVED" ? undefined : entry.unitPrice,
    amount: entry.amount,
    customerName: entry.customerName,
    verified: entry.verified,
    description: entry.description ?? "",
    deliveryDate: entry.deliveryDate,
    // RECEIVED type fields - use quantity if emptyCylinderReceived is null, default to 1 for RECEIVED
    paymentType: entry.paymentType ?? "CREDIT",
    paymentAmount: entry.paymentAmount ?? 0,
    paymentReceivedBy: entry.paymentReceivedBy ?? "",
    emptyCylinderReceived: entry.cylinderType === "RECEIVED" 
      ? (entry.emptyCylinderReceived ?? entry.quantity ?? 1)
      : undefined,
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={`/add-cylinder/${params.id}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">Edit Cylinder Entry</h1>
          </div>

          <div className="max-w-2xl">
            <CylinderForm onSubmit={handleSubmit} customers={customers} initialValues={initialValues} />
          </div>
        </main>
      </div>
    </div>
  );
}

