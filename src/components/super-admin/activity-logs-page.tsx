"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  action: string;
  module: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function ActivityLogsContent() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticated = sessionStorage.getItem("superAdminAuthenticated");
    if (!authenticated) {
      router.push("/super-admin");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated, moduleFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== "all") {
        params.append("module", moduleFilter);
      }
      params.append("limit", "200");

      const response = await fetch(`/api/super-admin/activity-logs?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch logs" }));
        console.error("Error fetching activity logs:", errorData);
        throw new Error(errorData.error || "Failed to fetch activity logs");
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      // Keep logs state empty on error
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/super-admin/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold">Activity Logs</CardTitle>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="Dashboard">Dashboard</SelectItem>
                    <SelectItem value="Add Cylinder">Add Cylinder</SelectItem>
                    <SelectItem value="Add Customer">Add Customer</SelectItem>
                    <SelectItem value="Payments">Payments</SelectItem>
                    <SelectItem value="Expenses">Expenses</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Reports">Reports</SelectItem>
                    <SelectItem value="Settings">Settings</SelectItem>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading activity logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No activity logs found.</div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">{log.action}</span>
                          {log.module && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              {log.module}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-sm text-slate-600">{log.details}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {log.user && (
                            <span>
                              User: {log.user.name} ({log.user.email})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.createdAt), "MMM dd, yyyy hh:mm:ss a")}
                          </span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
    </main>
  );
}

