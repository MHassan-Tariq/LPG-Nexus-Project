import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { SuperAdminDashboardContent } from "@/components/super-admin/super-admin-dashboard";

export default function SuperAdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <SuperAdminDashboardContent />
      </div>
    </div>
  );
}

