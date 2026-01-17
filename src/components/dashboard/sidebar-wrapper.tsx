import { DashboardSidebar } from "./sidebar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { checkModuleAccess } from "@/lib/permissions";
import { getSystemSettingsFilter } from "@/lib/tenant-utils";

export async function DashboardSidebarWrapper() {
  // Get current user first
  const currentUser = await getCurrentUser();

  let softwareName = "LPG Nexus";
  let softwareLogo = null;

  // Only fetch settings if user is authenticated
  if (currentUser) {
    try {
      const settingsFilter = await getSystemSettingsFilter();

      // Fetch software name and logo from database
      const [softwareNameSetting, logoSetting] = await Promise.all([
        prisma.systemSettings.findFirst({
          where: {
            ...settingsFilter,
            key: "softwareName",
          },
        }),
        prisma.systemSettings.findFirst({
          where: {
            ...settingsFilter,
            key: "softwareLogo",
          },
        }),
      ]);

      if (softwareNameSetting?.value) {
        softwareName = softwareNameSetting.value;
      }
      softwareLogo = logoSetting ? (logoSetting.value || null) : null;
    } catch (error: any) {
      if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
        throw error;
      }
      console.error("Error fetching sidebar settings:", error);
      // Fallback to defaults -> already set
    }
  }

  // Get current user role
  const userRole = currentUser?.role || null;

  // Get user permissions to filter nav items
  let userPermissions: Record<string, string> = {};
  if (currentUser) {
    // Check permissions for each nav item
    const permissionPromises = [
      { href: "/", module: "dashboard" },
      { href: "/add-cylinder", module: "addCylinder" },
      { href: "/add-customer", module: "addCustomer" },
      { href: "/payments", module: "payments" },
      { href: "/payment-logs", module: "paymentLogs" },
      { href: "/expenses", module: "expenses" },
      { href: "/inventory", module: "inventory" },
      { href: "/reports", module: "reports" },
      { href: "/notes", module: "notes" },
      { href: "/settings", module: "settings" },
      { href: "/backup", module: "backup" },
    ].map(async ({ module }) => {
      const access = await checkModuleAccess(module);
      return { module, access };
    });

    const permissions = await Promise.all(permissionPromises);
    userPermissions = permissions.reduce((acc, { module, access }) => {
      acc[module] = access;
      return acc;
    }, {} as Record<string, string>);
  }

  return (
    <DashboardSidebar
      softwareName={softwareName}
      softwareLogo={softwareLogo}
      userRole={userRole}
      userPermissions={userPermissions}
    />
  );
}

