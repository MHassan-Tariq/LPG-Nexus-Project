export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  } catch (error: any) {
    if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
      throw error;
    }
    console.error("Error fetching software name:", error);
    // Use default value if query fails
    softwareName = "LPG Nexus";
  }

  return (
    <ReportsClient
      initialMonth={searchParams.month}
      initialYear={searchParams.year}
      softwareName={softwareName}
    />
  );
}

