"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, Activity as ActivityIcon, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

interface RecentActivity {
  id: string;
  action: string;
  module: string | null;
  details: string | null;
  createdAt: Date;
}

interface ActivityPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize] = useState(5); // Default 5 activities per page
  const [activityPagination, setActivityPagination] = useState<ActivityPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("activityPage", activityPage.toString());
        params.append("activityPageSize", activityPageSize.toString());

        const response = await fetch(`/api/super-admin/overview?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
          setActivityPagination(data.activityPagination || null);
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activityPage, activityPageSize]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: stats && stats.totalUsers > 0 ? "up" : null,
    },
    {
      label: "Verified",
      value: stats?.verifiedUsers || 0,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      trend: stats && stats.verifiedUsers > 0 ? "up" : null,
    },
    {
      label: "Unverified",
      value: stats?.unverifiedUsers || 0,
      icon: XCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: null,
    },
    {
      label: "System Activity",
      value: activityPagination?.total || recentActivity.length,
      icon: ActivityIcon,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 mb-4">
          <TrendingUp className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600 mt-1">Quick summary of system statistics and recent activity</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
                {stat.trend && (
                  <div className="mt-4 flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Active</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <ActivityIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ActivityIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                      {activity.module && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {activity.module}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {activityPagination && activityPagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500 md:px-6">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span>{activityPage}</span>
                      <span className="text-slate-400">of</span>
                      <span>{activityPagination.totalPages}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={activityPage === 1 || isLoading}
                      onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                      className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                    >
                      Previous
                    </Button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                      {activityPage}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={activityPage >= activityPagination.totalPages || isLoading}
                      onClick={() => setActivityPage((prev) => prev + 1)}
                      className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

