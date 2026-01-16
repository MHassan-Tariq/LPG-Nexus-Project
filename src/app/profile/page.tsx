import { redirect } from "next/navigation";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { ProfileForm } from "@/components/profile/profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export default async function ProfilePage() {
  // Get the current logged-in user from JWT
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch the full user data from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <DashboardSidebarWrapper />
        <div className="content-shell flex flex-1 flex-col">
          <DashboardTopbarWrapper />
          <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
            <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-8 shadow-none">
              <p className="text-sm text-slate-600">User not found. Please log in again.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <ProfileForm initialData={user} />
        </main>
      </div>
    </div>
  );
}

