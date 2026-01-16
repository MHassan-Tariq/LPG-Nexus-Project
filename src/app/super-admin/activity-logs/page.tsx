import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { ActivityLogsContent } from "@/components/super-admin/activity-logs-page";

export default function ActivityLogsPageRoute() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <ActivityLogsContent />
      </div>
    </div>
  );
}

