import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import { getSystemSettingsFilter } from "@/lib/tenant-utils";

export default async function SettingsPage() {
  // Check permissions before rendering
  await enforcePagePermission("/settings");
  
  const settingsFilter = await getSystemSettingsFilter();
  
  // Fetch current settings (using same adminId as when saving)
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

  const currentSettings = {
    softwareName: softwareNameSetting?.value || "LPG Nexus",
    // Preserve empty string as empty string (don't convert to null)
    // Only use null if the setting doesn't exist at all
    softwareLogo: logoSetting ? (logoSetting.value || null) : null,
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          {/* Header - Only show for non-overview tabs */}
          <div className="rounded-[24px] border border-transparent px-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff]">
                <Settings className="h-5 w-5 text-[#2544d6]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Software Settings</h1>
                <p className="text-sm text-slate-500">Customize your software name and branding</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <SettingsTabs initialSettings={currentSettings} />
        </main>
      </div>
    </div>
  );
}

