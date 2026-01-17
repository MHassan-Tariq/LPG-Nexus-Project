"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, BarChart3, TrendingUp, Users, Shield, Activity, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import { ReportsCharts } from "./reports-charts";

interface ReportData {
  userActivityReports: UserActivityReport[];
  permissionChangeReports: PermissionChangeReport[];
  moduleUsageReports: ModuleUsageReport[];
  auditLogs: AuditLog[];
  superAdminActionReports: SuperAdminActionReport[];
  summary: ReportSummary;
}

interface UserActivityReport {
  userId: string;
  userName: string;
  userEmail: string;
  loginCount: number;
  lastLogin: string;
  actionsPerformed: number;
  roleChanges: number;
}

interface PermissionChangeReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  module: string;
  previousPermission: string;
  newPermission: string;
  changedBy: string;
  changedAt: string;
}

interface ModuleUsageReport {
  module: string;
  accessCount: number;
  uniqueUsers: number;
  lastAccessed: string;
}

interface AuditLog {
  id: string;
  action: string;
  module: string | null;
  details: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

interface SuperAdminActionReport {
  id: string;
  action: string;
  module: string | null;
  details: string | null;
  affectedUser: string | null;
  createdAt: string;
}

interface ReportSummary {
  totalUsers: number;
  totalActions: number;
  totalPermissionChanges: number;
  totalModuleAccesses: number;
  mostActiveAdmin: string;
  mostModifiedModule: string;
}

export function ReportsAnalysisTab() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedActionType, setSelectedActionType] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<"user-activity" | "permissions" | "module-usage" | "audit-logs" | "super-admin-actions">("user-activity");

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to, selectedModule, selectedUser, selectedActionType]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("from", dateRange.from.toISOString());
      params.append("to", dateRange.to.toISOString());
      if (selectedModule !== "all") params.append("module", selectedModule);
      if (selectedUser !== "all") params.append("userId", selectedUser);
      if (selectedActionType !== "all") params.append("actionType", selectedActionType);

      const response = await fetch(`/api/super-admin/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Report data received:", {
          summary: data.summary,
          userActivityReportsCount: data.userActivityReports?.length || 0,
          auditLogsCount: data.auditLogs?.length || 0,
          dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        });
        setReportData(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch reports" }));
        console.error("Error fetching report data:", errorData);
        // Set empty data structure on error
        setReportData({
          userActivityReports: [],
          permissionChangeReports: [],
          moduleUsageReports: [],
          auditLogs: [],
          superAdminActionReports: [],
          summary: {
            totalUsers: 0,
            totalActions: 0,
            totalPermissionChanges: 0,
            totalModuleAccesses: 0,
            mostActiveAdmin: "N/A",
            mostModifiedModule: "N/A",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      // Set empty data structure on error
      setReportData({
        userActivityReports: [],
        permissionChangeReports: [],
        moduleUsageReports: [],
        auditLogs: [],
        superAdminActionReports: [],
        summary: {
          totalUsers: 0,
          totalActions: 0,
          totalPermissionChanges: 0,
          totalModuleAccesses: 0,
          mostActiveAdmin: "N/A",
          mostModifiedModule: "N/A",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (fileFormat: "pdf" | "excel") => {
    try {
      const params = new URLSearchParams();
      params.append("from", dateRange.from.toISOString());
      params.append("to", dateRange.to.toISOString());
      params.append("format", fileFormat);
      if (selectedModule !== "all") params.append("module", selectedModule);
      if (selectedUser !== "all") params.append("userId", selectedUser);
      if (selectedActionType !== "all") params.append("actionType", selectedActionType);
      params.append("section", activeSection);

      const response = await fetch(`/api/super-admin/reports/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `super-admin-reports-${fileFormat}-${format(new Date(), "yyyy-MM-dd")}.${fileFormat === "pdf" ? "pdf" : "xlsx"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  if (isLoading && !reportData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      </div>
    );
  }

  // Initialize empty data if reportData is null
  const data = reportData || {
    userActivityReports: [],
    permissionChangeReports: [],
    moduleUsageReports: [],
    auditLogs: [],
    superAdminActionReports: [],
    summary: {
      totalUsers: 0,
      totalActions: 0,
      totalPermissionChanges: 0,
      totalModuleAccesses: 0,
      mostActiveAdmin: "N/A",
      mostModifiedModule: "N/A",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              Reports & Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleExport("pdf")}
                variant="outline"
                className="h-9 rounded-xl border-gray-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={() => handleExport("excel")}
                variant="outline"
                className="h-9 rounded-xl border-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date From</Label>
              <DatePickerWithInput
                date={dateRange.from}
                onChange={(date) => {
                  if (date) {
                    setDateRange((prev) => ({ ...prev, from: date }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date To</Label>
              <DatePickerWithInput
                date={dateRange.to}
                onChange={(date) => {
                  if (date) {
                    setDateRange((prev) => ({ ...prev, to: date }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Module</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="border-gray-300">
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
                  <SelectItem value="Notes">Notes</SelectItem>
                  <SelectItem value="Backup">Backup</SelectItem>
                  <SelectItem value="Restore">Restore</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Action Type</Label>
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="User Updated">User Updated</SelectItem>
                  <SelectItem value="Permission Changed">Permission Changed</SelectItem>
                  <SelectItem value="User Created">User Created</SelectItem>
                  <SelectItem value="User Deleted">User Deleted</SelectItem>
                  <SelectItem value="Role Changed">Role Changed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Actions</p>
                <p className="text-3xl font-bold text-gray-900">{data.summary.totalActions}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Permission Changes</p>
                <p className="text-3xl font-bold text-gray-900">{data.summary.totalPermissionChanges}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Module Accesses</p>
                <p className="text-3xl font-bold text-gray-900">{data.summary.totalModuleAccesses}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Most Active Admin</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{data.summary.mostActiveAdmin || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <ReportsCharts data={data} dateRange={dateRange} />

      {/* Navigation Tabs for Report Sections */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <div className="flex border-b border-gray-200">
            {[
              { id: "user-activity", label: "User Activity", icon: Users },
              { id: "permissions", label: "Permission Changes", icon: Shield },
              { id: "module-usage", label: "Module Usage", icon: BarChart3 },
              { id: "audit-logs", label: "Audit Logs", icon: FileText },
              { id: "super-admin-actions", label: "Super Admin Actions", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeSection === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Report Content Sections */}
          <div className="p-6">
            {activeSection === "user-activity" && (
              <UserActivitySection reports={data.userActivityReports} />
            )}
            {activeSection === "permissions" && (
              <PermissionChangesSection reports={data.permissionChangeReports} />
            )}
            {activeSection === "module-usage" && (
              <ModuleUsageSection reports={data.moduleUsageReports} />
            )}
            {activeSection === "audit-logs" && (
              <AuditLogsSection logs={data.auditLogs} />
            )}
            {activeSection === "super-admin-actions" && (
              <SuperAdminActionsSection reports={data.superAdminActionReports} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Section Components
function UserActivitySection({ reports }: { reports: UserActivityReport[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(reports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedReports = reports.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">User Activity Reports</h3>
        <span className="text-sm text-gray-500">{reports.length} user{reports.length !== 1 ? 's' : ''}</span>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No user activity data available</p>
          <p className="text-sm text-gray-400">Activity data will appear here once users start performing actions in the system.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Login Count</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Last Login</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions Performed</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Role Changes</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report) => (
                  <tr key={report.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{report.userName}</div>
                        <div className="text-sm text-gray-500">{report.userEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{report.loginCount}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {format(new Date(report.lastLogin), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{report.actionsPerformed}</td>
                    <td className="py-3 px-4 text-gray-900">{report.roleChanges}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>{page}</span>
                  <span className="text-slate-400">of</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Previous
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                  {page}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PermissionChangesSection({ reports }: { reports: PermissionChangeReport[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(reports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedReports = reports.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Permission Change History</h3>
        <span className="text-sm text-gray-500">{reports.length} changes</span>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No permission changes recorded</p>
          <p className="text-sm text-gray-400">Permission changes will appear here when user permissions are modified.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedReports.map((report) => (
              <div key={report.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{report.userName}</span>
                      <span className="text-sm text-gray-500">({report.userEmail})</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Module:</span> {report.module}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-red-600">
                        <span className="font-medium">From:</span> {report.previousPermission}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600">
                        <span className="font-medium">To:</span> {report.newPermission}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Changed by</div>
                    <div className="text-sm font-medium text-gray-900">{report.changedBy}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(report.changedAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>{page}</span>
                  <span className="text-slate-400">of</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Previous
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                  {page}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ModuleUsageSection({ reports }: { reports: ModuleUsageReport[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(reports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedReports = reports.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Module Usage Reports</h3>
        <span className="text-sm text-gray-500">{reports.length} modules</span>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No module usage data available</p>
          <p className="text-sm text-gray-400">Module usage statistics will appear here once users access different modules.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedReports.map((report) => (
              <Card key={report.module} className="shadow-sm border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{report.module}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Access Count:</span>
                          <span className="font-medium text-gray-900">{report.accessCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unique Users:</span>
                          <span className="font-medium text-gray-900">{report.uniqueUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last accessed: {format(new Date(report.lastAccessed), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>{page}</span>
                  <span className="text-slate-400">of</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Previous
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                  {page}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AuditLogsSection({ logs }: { logs: AuditLog[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(logs.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Audit Logs</h3>
        <span className="text-sm text-gray-500">{logs.length} logs</span>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No audit logs available</p>
          <p className="text-sm text-gray-400">Audit logs will appear here as system activities are logged.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{log.action}</span>
                      {log.module && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {log.module}
                        </span>
                      )}
                    </div>
                    {log.details && <p className="text-sm text-gray-600 mb-2">{log.details}</p>}
                    {log.userName && (
                      <div className="text-sm text-gray-500">
                        User: {log.userName}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>{page}</span>
                  <span className="text-slate-400">of</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Previous
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                  {page}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SuperAdminActionsSection({ reports }: { reports: SuperAdminActionReport[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(reports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedReports = reports.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Super Admin Action Reports</h3>
        <span className="text-sm text-gray-500">{reports.length} actions</span>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No super admin actions recorded</p>
          <p className="text-sm text-gray-400">Super admin actions will appear here when administrative tasks are performed.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedReports.map((report) => (
              <div key={report.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{report.action}</span>
                      {report.module && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                          {report.module}
                        </span>
                      )}
                    </div>
                    {report.details && <p className="text-sm text-gray-600 mb-2">{report.details}</p>}
                    {report.affectedUser && (
                      <div className="text-sm text-gray-500">
                        Affected User: {report.affectedUser}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>{page}</span>
                  <span className="text-slate-400">of</span>
                  <span>{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Previous
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                  {page}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
