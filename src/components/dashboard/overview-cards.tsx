import { ReactNode } from "react";
import { DollarSign, BadgeIndianRupee, Box, Package, TrendingUp, CreditCard, Boxes, AlertTriangle, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface OverviewCardsProps {
  metrics: {
    homeExpenses: number;
    otherExpenses: number;
    counterSale: number;
    billReceivables: number;
    profit: number;
    pendingBills: number;
    pendingCustomers: number;
  };
  cylinders: {
    total: number;
    inCount: number;
    outCount: number;
    empty: number;
  };
}

const cardBaseClasses =
  "flex flex-col justify-between rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md";

const iconStyle = "flex h-10 w-10 items-center justify-center rounded-full";

export function OverviewCards({ metrics, cylinders }: OverviewCardsProps) {
  // Calculate total expenses (home + other)
  const totalExpenses = metrics.homeExpenses + metrics.otherExpenses;

  const cards: Array<{
    title: string;
    value: number;
    description: ReactNode;
    icon: ReactNode;
    iconClass: string;
    format: "currency" | "number";
  }> = [
    {
      title: "Expenses",
      value: totalExpenses,
      description: "Total amount",
      icon: <Receipt className="h-5 w-5 text-[#8E5CFF]" />,
      iconClass: `${iconStyle} bg-[#efe8ff]`,
      format: "currency",
    },
    {
      title: "Bill Receivables",
      value: metrics.billReceivables,
      description: "Total amount",
      icon: <TrendingUp className="h-5 w-5 text-[#FF9B4A]" />,
      iconClass: `${iconStyle} bg-[#fff2e5]`,
      format: "currency",
    },
    {
      title: "Profit",
      value: metrics.profit,
      description: "Total amount",
      icon: <Box className="h-5 w-5 text-[#5A68FF]" />,
      iconClass: `${iconStyle} bg-[#ecefff]`,
      format: "currency",
    },
    {
      title: "Total Cylinders",
      value: cylinders.total,
      description: (
        <div className="mt-3 flex gap-4 text-xs text-slate-400">
          <span>
            In <span className="font-medium text-slate-600">{cylinders.inCount}</span>
          </span>
          <span>
            Out <span className="font-medium text-slate-600">{cylinders.outCount}</span>
          </span>
        </div>
      ),
      icon: <Boxes className="h-5 w-5 text-[#5A68FF]" />,
      iconClass: `${iconStyle} bg-[#ecefff]`,
      format: "number",
    },
    {
      title: "Empty Cylinders",
      value: cylinders.empty,
      description: "Awaiting collection",
      icon: <Package className="h-5 w-5 text-[#27C281]" />,
      iconClass: `${iconStyle} bg-[#e5f7ef]`,
      format: "number",
    },
    {
      title: "Pending Bills",
      value: metrics.pendingBills,
      description: `From ${metrics.pendingCustomers} customers`,
      icon: <AlertTriangle className="h-5 w-5 text-[#FF9B4A]" />,
      iconClass: `${iconStyle} bg-[#fff2e5]`,
      format: "currency",
    },
  ];

  const formatValue = (value: number, format: "currency" | "number") => {
    if (format === "currency") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  const firstRow = cards.slice(0, 3);
  const secondRow = cards.slice(3);

  const renderRow = (rowCards: typeof cards, className: string) => (
    <div className={className}>
      {rowCards.map((card) => (
        <Card key={card.title} className={cardBaseClasses}>
          <CardContent className="flex flex-col gap-6 p-0">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900 whitespace-nowrap">{formatValue(card.value, card.format)}</p>
                {typeof card.description === "string" ? (
                  <p className="mt-3 text-xs text-slate-400">{card.description}</p>
                ) : (
                  card.description
                )}
              </div>
              <div className={card.iconClass}>{card.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderRow(firstRow, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3")}
      {renderRow(secondRow, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3")}
    </div>
  );
}

