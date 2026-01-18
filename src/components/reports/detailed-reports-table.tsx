"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DetailedReportRow {
  category: string;
  count: number;
  revenue: number;
  growth: number;
}

interface DetailedReportsTableProps {
  data: DetailedReportRow[];
  isLoading?: boolean;
}

import { formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export function DetailedReportsTable({ data, isLoading }: DetailedReportsTableProps) {
  return (
    <Card className="rounded-xl border border-[#e5eaf4] bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Detailed Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={data.length || 5} columns={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Category</TableHead>
                <TableHead className="font-semibold text-slate-700">Count</TableHead>
                <TableHead className="font-semibold text-slate-700">Revenue/Amount</TableHead>
                <TableHead className="font-semibold text-slate-700">Growth</TableHead>
                <TableHead className="font-semibold text-slate-700">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const isPositive = row.growth >= 0;
                const TrendIcon = isPositive ? TrendingUp : TrendingDown;

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-slate-900">{row.category}</TableCell>
                    <TableCell className="text-slate-600">{row.count}</TableCell>
                    <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                      {formatCurrency(row.revenue)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          isPositive ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {row.growth.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <TrendIcon
                        className={cn("h-5 w-5", isPositive ? "text-green-600" : "text-red-600")}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

