import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { getBillAction } from "@/app/payments/actions";
import { notFound } from "next/navigation";
import { BillDownloadPageClient } from "@/components/payments/bill-download-page-client";

interface DownloadBillPageProps {
  params: { id: string };
}

export default async function DownloadBillPage({ params }: DownloadBillPageProps) {
  const result = await getBillAction(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const bill = result.data;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <BillDownloadPageClient bill={bill} />
        </main>
      </div>
    </div>
  );
}

