import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { ReportsClient } from "@/components/reports/reports-client";
import { enforcePagePermission } from "@/lib/permission-check";
import { prisma } from "@/lib/prisma";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

interface ReportsPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/reports");
  
  // Fetch software name from settings with error handling (with tenant filter)
  let softwareName = "LPG Nexus";
  try {
    const tenantFilter = await getTenantFilter();
    const softwareNameSetting = await prisma.systemSettings.findFirst({
      where: {
        ...tenantFilter,
        key: "softwareName",
      },
    });
    softwareName = softwareNameSetting?.value || "LPG Nexus";
  } catch (error) {
    console.error("Error fetching software name:", error);
    // Use default value if query fails
    softwareName = "LPG Nexus";
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <ReportsClient
            initialMonth={searchParams.month}
            initialYear={searchParams.year}
            softwareName={softwareName}
          />
        </main>
      </div>
    </div>
  );
}

