import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getSystemSettingsFilter } from "./tenant-utils";
import { getCurrentUser } from "./jwt";

export const getSoftwareName = cache(async (): Promise<string> => {
  try {
    const settingsFilter = await getSystemSettingsFilter();
    const softwareNameSetting = await prisma.systemSettings.findFirst({
      where: {
        ...settingsFilter,
        key: "softwareName",
      },
    });
    return softwareNameSetting?.value || "LPG Nexus";
  } catch (error: any) {
    if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
      throw error;
    }
    console.error("Error fetching software name:", error);
    return "LPG Nexus";
  }
});

export const getSoftwareLogo = cache(async (): Promise<string | null> => {
  try {
    const settingsFilter = await getSystemSettingsFilter();
    const logoSetting = await prisma.systemSettings.findFirst({
      where: {
        ...settingsFilter,
        key: "softwareLogo",
      },
    });
    return logoSetting?.value || null;
  } catch (error: any) {
    console.error("Error fetching software logo:", error);
    return null;
  }
});

export const getFullUserData = cache(async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        profileImage: true,
        role: true,
      },
    });
  } catch (error) {
    console.error("Error fetching full user data:", error);
    return null;
  }
});
