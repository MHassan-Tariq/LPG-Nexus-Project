import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { getCylinderEntry } from "../../actions";
import { notFound } from "next/navigation";
import { CylinderDownloadPageClient } from "@/components/add-cylinder/cylinder-download-page-client";

interface DownloadCylinderPageProps {
  params: { id: string };
}

export default async function DownloadCylinderPage({ params }: DownloadCylinderPageProps) {
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
          <CylinderDownloadPageClient entry={{
            ...entry,
            cylinderType: entry.cylinderType as "DELIVERED" | "RECEIVED",
          }} />
        </main>
      </div>
    </div>
  );
}
