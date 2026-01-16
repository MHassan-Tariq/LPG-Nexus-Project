"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomerCylinderSummary {
  customerId: string | null;
  customerName: string;
  customerCode: number | null;
  totalDelivered: number;
  totalReceived: number;
  remaining: number;
}

interface CustomerCylinderSummaryProps {
  summaries: CustomerCylinderSummary[];
}

export function CustomerCylinderSummary({ summaries }: CustomerCylinderSummaryProps) {
  // Sort by customer code, then by name
  const sortedSummaries = [...summaries].sort((a, b) => {
    if (a.customerCode !== null && b.customerCode !== null) {
      return a.customerCode - b.customerCode;
    }
    if (a.customerCode !== null) return -1;
    if (b.customerCode !== null) return 1;
    return a.customerName.localeCompare(b.customerName);
  });

  const totalDelivered = summaries.reduce((sum, s) => sum + s.totalDelivered, 0);
  const totalReceived = summaries.reduce((sum, s) => sum + s.totalReceived, 0);
  const totalRemaining = summaries.reduce((sum, s) => sum + s.remaining, 0);

  return (
    <Card className="rounded-[32px] border border-[#e5eaf4] bg-white shadow-sm">
      <CardHeader className="border-b border-[#f0f3fb] pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Customer Cylinder Summary
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Breakdown of cylinders given, received, and remaining per customer
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {sortedSummaries.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No customer data available
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="flex flex-wrap items-center gap-4 border-b border-[#f0f3fb] px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Total Delivered:</span>
                <Badge className="rounded-full bg-blue-100 text-blue-700 border-blue-200">
                  {totalDelivered}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Total Received:</span>
                <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-emerald-200">
                  {totalReceived}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Total Remaining:</span>
                <Badge className={cn(
                  "rounded-full border",
                  totalRemaining > 0 
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                )}>
                  {totalRemaining}
                </Badge>
              </div>
            </div>

            {/* Customer Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-24 font-semibold text-slate-700">ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Customer Name</TableHead>
                    <TableHead className="w-32 text-right font-semibold text-slate-700">
                      Delivered
                    </TableHead>
                    <TableHead className="w-32 text-right font-semibold text-slate-700">
                      Received
                    </TableHead>
                    <TableHead className="w-32 text-right font-semibold text-slate-700">
                      Remaining
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSummaries.map((summary) => (
                    <TableRow
                      key={summary.customerId || summary.customerName}
                      className="hover:bg-slate-50/50"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {summary.customerCode ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {summary.customerName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="rounded-full bg-blue-100 text-blue-700 border-blue-200">
                          {summary.totalDelivered}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-emerald-200">
                          {summary.totalReceived}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={cn(
                            "rounded-full border",
                            summary.remaining > 0
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : summary.remaining === 0
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          )}
                        >
                          {summary.remaining}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
