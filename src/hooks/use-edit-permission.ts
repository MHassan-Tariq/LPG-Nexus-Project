"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getModuleFromRoute } from "@/lib/route-module-map";

export function useEditPermission(moduleId?: string) {
  const pathname = usePathname();
  const [canEdit, setCanEdit] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkEditAccess() {
      try {
        const module = moduleId || getModuleFromRoute(pathname);
        if (!module) {
          setCanEdit(true);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/permissions/check?module=${module}`);
        if (!response.ok) {
          setCanEdit(false);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const accessLevel = data.accessLevel || "NO_ACCESS";
        setCanEdit(accessLevel === "EDIT" || accessLevel === "FULL_ACCESS");
      } catch (error) {
        console.error("Error checking edit permissions:", error);
        setCanEdit(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkEditAccess();
  }, [pathname, moduleId]);

  return { canEdit, isLoading };
}
