"use client";

import { TrendingUp, TrendingDown, DollarSign, Package, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  change: {
    percentage: number;
    label: string;
  };
  icon: React.ReactNode;
  iconColor: string;
}

function SummaryCard({ title, value, change, icon, iconColor }: SummaryCardProps) {
  const isPositive = change.percentage >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="rounded-xl border border-[#e5eaf4] bg-white shadow-none">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            <div className="mt-3 flex items-center gap-1">
              <TrendIcon
                className={cn("h-4 w-4", isPositive ? "text-green-600" : "text-red-600")}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-green-600" : "text-red-600",
                )}
              >
                {isPositive ? "+" : ""}
                {change.percentage.toFixed(1)}%
              </span>
              <span className="whitespace-nowrap text-sm text-slate-500">{change.label}</span>
            </div>
          </div>
          <div className={cn("flex-shrink-0 rounded-xl p-3", iconColor)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  totalRevenue: number;
  totalExpenses: number;
  cylindersDelivered: number;
  netProfit: number;
  revenueChange: number;
  expensesChange: number;
  cylindersChange: number;
  profitChange: number;
}

import { formatCurrency, formatNumber } from "@/lib/utils";

export function SummaryCards({
  totalRevenue,
  totalExpenses,
  cylindersDelivered,
  netProfit,
  revenueChange,
  expensesChange,
  cylindersChange,
  profitChange,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Revenue"
        value={formatCurrency(totalRevenue)}
        change={{
          percentage: revenueChange,
          label: "from last month",
        }}
        icon={<DollarSign className="h-6 w-6 text-green-600" />}
        iconColor="bg-green-50"
      />
      <SummaryCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        change={{
          percentage: expensesChange,
          label: "from last month",
        }}
        icon={<Receipt className="h-6 w-6 text-red-600" />}
        iconColor="bg-red-50"
      />
      <SummaryCard
        title="Cylinders Delivered"
        value={formatNumber(cylindersDelivered)}
        change={{
          percentage: cylindersChange,
          label: "from last month",
        }}
        icon={<Package className="h-6 w-6 text-blue-600" />}
        iconColor="bg-blue-50"
      />
      <SummaryCard
        title="Net Profit"
        value={formatCurrency(netProfit)}
        change={{
          percentage: profitChange,
          label: "from last month",
        }}
        icon={<DollarSign className={cn("h-6 w-6", netProfit >= 0 ? "text-green-600" : "text-red-600")} />}
        iconColor={cn(netProfit >= 0 ? "bg-green-50" : "bg-red-50")}
      />
    </div>
  );
}

