import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { UserAccountView } from "@/components/super-admin/user-account-view";
import { enforcePagePermission } from "@/lib/permission-check";

interface UserAccountPageProps {
  params: {
    id: string;
  };
}

export default async function UserAccountPage({ params }: UserAccountPageProps) {
  await enforcePagePermission("/super-admin");
  
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <UserAccountView userId={params.id} />
        </main>
      </div>
    </div>
  );
}

