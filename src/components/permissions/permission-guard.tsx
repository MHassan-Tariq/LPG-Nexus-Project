"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AccessDenied } from "./access-denied";
import { cn } from "@/lib/utils";

interface PermissionGuardProps {
  children: ReactNode;
  moduleId?: string;
  fallback?: ReactNode;
}

type AccessLevel = "FULL_ACCESS" | "VIEW_ONLY" | "EDIT" | "NO_ACCESS" | "NOT_SHOW";

const routeToModuleMap: Record<string, string> = {
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
  "/profile": "profile",
};

function getModuleFromRoute(pathname: string): string | null {
  if (pathname === "/") {
    return "dashboard";
  }

  if (routeToModuleMap[pathname]) {
    return routeToModuleMap[pathname];
  }

  for (const [route, module] of Object.entries(routeToModuleMap)) {
    if (pathname.startsWith(route)) {
      return module;
    }
  }

  return null;
}

export function PermissionGuard({ children, moduleId, fallback }: PermissionGuardProps) {
  const pathname = usePathname();
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const module = moduleId || getModuleFromRoute(pathname);
        if (!module) {
          // If no module found, allow access (might be a public route)
          setAccessLevel("FULL_ACCESS");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/permissions/check?module=${module}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Permission check failed:", errorData);
          setAccessLevel("NO_ACCESS");
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        if (data.error) {
          console.error("Permission check error:", data.error);
        }
        setAccessLevel(data.accessLevel || "NO_ACCESS");
      } catch (error) {
        console.error("Error checking permissions:", error);
        setAccessLevel("NO_ACCESS");
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [pathname, moduleId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Checking permissions...</div>
      </div>
    );
  }

  if (accessLevel === "NOT_SHOW") {
    // For NOT_SHOW: Redirect to access denied page (shouldn't be accessible)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center max-w-md">
          <p className="text-base font-semibold text-red-900 mb-2">Access Denied</p>
          <p className="text-sm text-red-700">
            This page is not available for your account.
          </p>
        </div>
      </div>
    );
  }

  if (accessLevel === "NO_ACCESS") {
    // For NO_ACCESS: Show blurred page with message overlay
    return (
      <div className="relative min-h-screen">
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-lg max-w-md mx-4">
            <p className="text-base font-semibold text-red-900 mb-2">Access Restricted</p>
            <p className="text-sm text-red-700">
              You are restricted by the super admin. You can only view this page. Editing and actions are not allowed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * ViewOnlyWrapper - Disables edit functionality when user only has VIEW_ONLY access
 */
interface ViewOnlyWrapperProps {
  children: ReactNode;
  moduleId?: string;
  className?: string;
}

export function ViewOnlyWrapper({ children, moduleId, className }: ViewOnlyWrapperProps) {
  const pathname = usePathname();
  const [canEdit, setCanEdit] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    async function checkEditAccess() {
      try {
        const module = moduleId || getModuleFromRoute(pathname);
        if (!module) {
          setCanEdit(true);
          setIsViewOnly(false);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/permissions/check?module=${module}`);
        if (!response.ok) {
          setCanEdit(false);
          setIsViewOnly(false);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const accessLevel = data.accessLevel || "NO_ACCESS";
        const hasEdit = accessLevel === "EDIT" || accessLevel === "FULL_ACCESS";
        setCanEdit(hasEdit);
        setIsViewOnly(accessLevel === "VIEW_ONLY");
      } catch (error) {
        console.error("Error checking edit permissions:", error);
        setCanEdit(false);
        setIsViewOnly(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkEditAccess();
  }, [pathname, moduleId]);

  // Show popup when user tries to interact with disabled elements
  useEffect(() => {
    if (!isViewOnly || isLoading) return;

    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked on interactive elements that are not disabled
      const interactiveEl = target.closest("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [role='button']:not([aria-disabled='true'])") as HTMLElement;
      
      if (interactiveEl && !interactiveEl.closest("[disabled]") && !interactiveEl.closest("fieldset[disabled]")) {
        // Check if it's a view-only action (not just viewing/navigating)
        const isViewAction = 
          interactiveEl.closest('a[href]') || 
          interactiveEl.getAttribute('aria-label')?.toLowerCase().includes('view') ||
          interactiveEl.title?.toLowerCase().includes('view');
        
        if (!isViewAction) {
          setShowPopup(true);
          // Auto-hide after 5 seconds
          const timer = setTimeout(() => setShowPopup(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    };

    document.addEventListener("click", handleInteraction, true);
    return () => {
      document.removeEventListener("click", handleInteraction, true);
    };
  }, [isViewOnly, isLoading]);

  if (isLoading) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  // For VIEW_ONLY: show page normally, no blur, just disable actions and show popup on interaction
  return (
    <div className={cn("relative", className)}>
      {showPopup && isViewOnly && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 max-w-md w-full mx-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">Access Restricted</p>
                <p className="text-sm text-red-700">
                  You are restricted by the super admin. You can only view this page. Editing and actions are not allowed.
                </p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss message"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
      </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

