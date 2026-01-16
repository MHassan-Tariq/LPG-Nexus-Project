// Map route paths to module IDs
export const routeToModuleMap: Record<string, string> = {
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

/**
 * Get the module ID from a route path
 */
export function getModuleFromRoute(pathname: string): string | null {
  // Handle root path
  if (pathname === "/") {
    return "dashboard";
  }

  // Check exact matches first
  if (routeToModuleMap[pathname]) {
    return routeToModuleMap[pathname];
  }

  // Check prefix matches (e.g., /add-cylinder/edit should match addCylinder)
  for (const [route, module] of Object.entries(routeToModuleMap)) {
    if (pathname.startsWith(route)) {
      return module;
    }
  }

  return null;
}
