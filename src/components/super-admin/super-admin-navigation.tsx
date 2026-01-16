"use client";

import { LayoutDashboard, Users, BarChart3, UserCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

interface SuperAdminNavigationProps {
  activeTab: "overview" | "users" | "my-account" | "factory-delete" | "reports-analysis";
  onTabChange: (tab: "overview" | "users" | "my-account" | "factory-delete" | "reports-analysis") => void;
  userRole?: string | null;
}

export function SuperAdminNavigation({ activeTab, onTabChange, userRole }: SuperAdminNavigationProps) {
  // Hide Users and Reports & Analysis tabs for ADMIN role
  const normalizedRole = userRole?.toString().toUpperCase().trim();
  const isSuperAdmin = normalizedRole === UserRole.SUPER_ADMIN.toString();
  const isAdmin = normalizedRole === UserRole.ADMIN.toString();
  const showUsersTab = isSuperAdmin;
  const showReportsTab = isSuperAdmin;

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-1 px-1">
        <button
          onClick={() => onTabChange("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </button>
        {showUsersTab && (
          <button
            onClick={() => onTabChange("users")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
        )}
        <button
          onClick={() => onTabChange("my-account")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "my-account"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <UserCircle className="h-4 w-4" />
          My Account Details
        </button>
        <button
          onClick={() => onTabChange("factory-delete")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "factory-delete"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Trash2 className="h-4 w-4" />
          Factory Delete
        </button>
        {showReportsTab && (
          <button
            onClick={() => onTabChange("reports-analysis")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "reports-analysis"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Reports & Analysis
          </button>
        )}
      </nav>
    </div>
  );
}

