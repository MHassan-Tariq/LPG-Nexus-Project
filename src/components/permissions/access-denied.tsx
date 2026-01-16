"use client";

import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AccessDeniedProps {
  moduleName?: string;
}

export function AccessDenied({ moduleName = "this page" }: AccessDeniedProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Lock Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-red-500 p-4 rounded-full">
                <Lock className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
              <p className="text-sm text-slate-600">
                I&apos;m not allowed by the super admin to access {moduleName}.
              </p>
            </div>

            {/* Warning Note */}
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Please contact your administrator if you believe you should have access to this page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

