"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminHeader } from "./super-admin-header";
import { SuperAdminNavigation } from "./super-admin-navigation";
import { OverviewTab } from "./overview-tab";
import { MyAccountTab } from "./my-account-tab";
import { FactoryDeleteTab } from "./factory-delete-tab";
import { ReportsAnalysisTab } from "./reports-analysis-tab";
import { UserManagementPanel } from "./user-management-panel";
import { SuperAdminInfoCard } from "./superadmin-info-card";
import { UserAccessGuard } from "./user-access-guard";

export function SuperAdminDashboardContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "my-account" | "factory-delete" | "reports-analysis">("overview");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if super admin is authenticated
    const authenticated = sessionStorage.getItem("superAdminAuthenticated");
    if (!authenticated) {
      router.push("/super-admin");
      return;
    }
    setIsAuthenticated(true);

    // Fetch user role
    async function fetchUserRole() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || null);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }
    fetchUserRole();
  }, [router]);

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab("my-account"); // Switch to my account tab when viewing a user
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col bg-gray-50">
      <SuperAdminHeader />
      <SuperAdminNavigation activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} />
      <div className="flex-1 px-4 pb-10 pt-6 lg:px-8">
        {activeTab === "overview" ? (
          <OverviewTab />
        ) : activeTab === "my-account" ? (
          <MyAccountTab selectedUserId={selectedUserId} onViewUser={handleViewUser} />
        ) : activeTab === "factory-delete" ? (
          <FactoryDeleteTab />
        ) : activeTab === "reports-analysis" ? (
          <UserAccessGuard>
            <ReportsAnalysisTab />
          </UserAccessGuard>
        ) : (
          <UserAccessGuard>
            <UserManagementPanel onViewUser={handleViewUser} />
          </UserAccessGuard>
        )}
      </div>
    </main>
  );
}

