"use client";

import { PermissionGuard } from "./permission-guard";
import { getModuleFromRoute } from "@/lib/route-module-map";

interface PagePermissionWrapperProps {
  children: React.ReactNode;
  pathname?: string;
}

export function PagePermissionWrapper({ children, pathname }: PagePermissionWrapperProps) {
  // Get module ID from pathname if provided, otherwise PermissionGuard will get it from usePathname
  const moduleId = pathname ? (getModuleFromRoute(pathname) ?? undefined) : undefined;
  
  return (
    <PermissionGuard moduleId={moduleId}>
      {children}
    </PermissionGuard>
  );
}
