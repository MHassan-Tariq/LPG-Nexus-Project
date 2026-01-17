import { DashboardTopbar } from "./topbar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { getSystemSettingsFilter } from "@/lib/tenant-utils";

export async function DashboardTopbarWrapper() {
  const currentUser = await getCurrentUser();
  let softwareName = "LPG Nexus";

  if (currentUser) {
    try {
      const settingsFilter = await getSystemSettingsFilter();

      // Fetch software name from settings (using same adminId as when saving)
      const softwareNameSetting = await prisma.systemSettings.findFirst({
        where: {
          ...settingsFilter,
          key: "softwareName",
        },
      });
      if (softwareNameSetting?.value) {
        softwareName = softwareNameSetting.value;
      }
    } catch (error: any) {
      if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
        throw error;
      }
      console.error("Error fetching topbar settings:", error);
    }
  }

  if (!currentUser) {
    return <DashboardTopbar userData={null} softwareName={softwareName} />;
  }

  // Fetch the full user data from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      name: true,
      email: true,
      username: true,
      profileImage: true,
      role: true,
    },
  });

  return <DashboardTopbar userData={user} softwareName={softwareName} />;
}

