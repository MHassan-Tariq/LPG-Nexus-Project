"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export function UserAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === "SUPER_ADMIN") {
            setHasAccess(true);
          } else {
            setHasAccess(false);
            router.push("/");
          }
        } else {
          setHasAccess(false);
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
        router.push("/login");
      }
    }

    checkAccess();
  }, [router]);

  if (hasAccess === null) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Checking permissions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
