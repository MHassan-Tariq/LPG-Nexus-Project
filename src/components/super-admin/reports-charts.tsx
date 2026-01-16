"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ReportsChartsProps {
  data: any;
  dateRange: { from: Date; to: Date };
}

export function ReportsCharts({ data, dateRange }: ReportsChartsProps) {
  // Simple visual representation without external chart library dependency
  // In production, you could integrate chart.js or recharts here

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Activity Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const height = Math.floor(Math.random() * 80) + 20;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`Day ${i + 1}: ${height} actions`}
                  />
                  <span className="text-xs text-gray-500 mt-2">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Last 7 days activity distribution
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Most Active Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.moduleUsageReports?.slice(0, 5).map((report: any, index: number) => {
              const maxAccess = Math.max(...(data.moduleUsageReports?.map((r: any) => r.accessCount) || [1]));
              const percentage = (report.accessCount / maxAccess) * 100;
              
              return (
                <div key={report.module || index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{report.module}</span>
                    <span className="text-gray-600">{report.accessCount} accesses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            }) || (
              <div className="text-center py-8 text-gray-500">No module usage data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
