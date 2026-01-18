import { DashboardSidebar } from "./sidebar";
import { getCurrentUser } from "@/lib/jwt";
import { getUserPermissions } from "@/lib/permissions";
import { getSoftwareName, getSoftwareLogo } from "@/lib/dashboard-data";

export async function DashboardSidebarWrapper() {
  const currentUser = await getCurrentUser();
  const [softwareName, softwareLogo, allPermissions] = await Promise.all([
    getSoftwareName(),
    getSoftwareLogo(),
    getUserPermissions(),
  ]);

  // Get current user role
  const userRole = currentUser?.role || null;

  // Get user permissions to filter nav items
  let userPermissions: Record<string, string> = {};
  
  if (allPermissions) {
    userPermissions = allPermissions as Record<string, string>;
  } else if (currentUser) {
    // Fallback: Default permissions based on role if no specific permissions found
    const defaultRole = currentUser.role?.toUpperCase();
    const defaultAccess = defaultRole === "ADMIN" || defaultRole === "SUPER_ADMIN" || defaultRole === "BRANCH_MANAGER" ? "EDIT" : "VIEW_ONLY";
    
    const modules = [
      "dashboard", "addCylinder", "addCustomer", "payments", 
      "paymentLogs", "expenses", "inventory", "reports", 
      "notes", "settings", "backup"
    ];
    
    userPermissions = modules.reduce((acc, mod) => {
      acc[mod] = defaultAccess;
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

