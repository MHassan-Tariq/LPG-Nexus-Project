"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  UserPlus,
  Receipt,
  CreditCard,
  FileText,
  Package,
  BarChart3,
  Database,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: UserRole[];
};

export const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard as any },
  { label: "Add Cylinder", href: "/add-cylinder", icon: PlusCircle as any },
  { label: "Add Customer", href: "/add-customer", icon: UserPlus as any },
  { label: "Expenses", href: "/expenses", icon: Receipt as any },
  { label: "Payments", href: "/payments", icon: CreditCard as any },
  { label: "Payment Logs", href: "/payment-logs", icon: FileText as any },
  { label: "Inventory", href: "/inventory", icon: Package as any },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 as any },
  { label: "Backup", href: "/backup", icon: Database as any },
  { label: "Notes", href: "/notes", icon: BookOpenCheck as any },
  { label: "Settings", href: "/settings", icon: Settings as any },
  // This will be dynamically labeled based on role
  { label: "Super Admin", href: "/super-admin", icon: ShieldCheck as any, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
];

/**
 * Get filtered nav items based on user role
 */
export function getNavItems(userRole?: string | null): NavItem[] {
  if (!userRole) {
    // If no role, only show items without role restrictions
    return allNavItems.filter((item) => !item.roles);
  }

  // Normalize role value - convert to enum format (uppercase)
  // Handle both enum values and string values
  const normalizedRole = userRole.toUpperCase().trim() as UserRole;
  
  return allNavItems.filter((item) => {
    // If item has roles restriction, check if user role is allowed
    if (item.roles && item.roles.length > 0) {
      // Check if any of the allowed roles match the user's role
      // Compare both as strings to ensure matching
      return item.roles.some((allowedRole) => 
        allowedRole.toString().toUpperCase() === normalizedRole.toString().toUpperCase()
      );
    }
    // If no roles restriction, show to everyone
    return true;
  });
}

// Export for backward compatibility (will be filtered in component)
export const navItems = allNavItems;

interface DashboardSidebarProps {
  softwareName?: string;
  softwareLogo?: string | null;
  userRole?: string | null;
  userPermissions?: Record<string, string>;
}

// Map nav item hrefs to module IDs for permission checking
const hrefToModuleMap: Record<string, string> = {
  "/": "dashboard",
  "/add-cylinder": "addCylinder",
  "/add-customer": "addCustomer",
  "/payments": "payments",
  "/payment-logs": "paymentLogs",
  "/expenses": "expenses",
  "/inventory": "inventory",
  "/reports": "reports",
  "/notes": "notes",
  "/settings": "settings",
  "/backup": "backup",
  "/super-admin": "superAdmin", // This one is role-based only
};

export function DashboardSidebar({
  softwareName = "LPG Nexus",
  softwareLogo = null,
  userRole = null,
  userPermissions = {},
}: DashboardSidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentSoftwareName, setCurrentSoftwareName] = useState(softwareName);
  const [currentSoftwareLogo, setCurrentSoftwareLogo] = useState<string | null>(softwareLogo);
  const pathname = usePathname();

  // Filter nav items based on user role first
  let filteredNavItems = getNavItems(userRole);

  // Update label for Super Admin/Admin menu item based on role
  filteredNavItems = filteredNavItems.map((item) => {
    if (item.href === "/super-admin") {
      const normalizedRole = userRole?.toString().toUpperCase().trim();
      // Check for SUPER_ADMIN role - show "Super Admin"
      if (normalizedRole === "SUPER_ADMIN") {
        return { ...item, label: "Super Admin" };
      } 
      // Check for ADMIN role - show "Admin"
      else if (normalizedRole === "ADMIN") {
        return { ...item, label: "Admin" };
      }
      // Default fallback (shouldn't happen if role filtering works correctly)
      return item;
    }
    return item;
  });

  // Filter out items with NOT_SHOW permission (hide from sidebar)
  filteredNavItems = filteredNavItems.filter((item) => {
    const moduleId = hrefToModuleMap[item.href];
    if (moduleId && userPermissions[moduleId]) {
      // Hide items where user has NOT_SHOW permission
      return userPermissions[moduleId] !== "NOT_SHOW";
    }
    // If no permission data, show the item
    return true;
  });

  useEffect(() => {
    const width = collapsed ? "5rem" : "18rem";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  // Update software name and logo when props change
  useEffect(() => {
    setCurrentSoftwareName(softwareName);
    setCurrentSoftwareLogo(softwareLogo);
  }, [softwareName, softwareLogo]);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      router.refresh();
    };

    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, [router]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden min-h-screen flex-col border-r bg-white transition-all duration-300 lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className={cn("flex h-20 items-center border-b", collapsed ? "justify-center px-0" : "px-6")}>
        <div className={cn(collapsed ? "flex items-center justify-center" : "flex items-center gap-3")}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            {currentSoftwareLogo && currentSoftwareLogo.trim() !== "" ? (
              // Use regular img tag for base64 images
              <img 
                src={currentSoftwareLogo} 
                alt={currentSoftwareName} 
                className="h-8 w-8 object-contain rounded-full"
              />
            ) : (
              <div className="relative h-8 w-8">
                <Image src="/logo.svg" alt={currentSoftwareName} fill priority sizes="32px" className="object-contain" />
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-800">{currentSoftwareName}</span>
              <span className="text-xs text-slate-400">Management System</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <nav className={cn("flex-1 space-y-1 py-6 overflow-y-auto", collapsed ? "px-2" : "px-4")}>
          {filteredNavItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition border-r-4 border-transparent",
                  isActive
                    ? "bg-[#eef3ff] text-[#2544d6] border-[#2544d6]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  collapsed && "justify-center px-0 py-4",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-center gap-2 border-t py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0",
            collapsed ? "px-2" : "px-6"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

