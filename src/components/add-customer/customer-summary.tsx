import { Card, CardContent } from "@/components/ui/card";
import { BadgeDollarSign, UserCheck, Users } from "lucide-react";

interface CustomerSummaryProps {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
  };
}

const numberFormatter = new Intl.NumberFormat("en-PK");

export function CustomerSummary({ stats }: CustomerSummaryProps) {
  const cards = [
    {
      label: "Total Customers",
      value: numberFormatter.format(stats.totalCustomers),
      accent: "bg-[#e7efff] text-[#1c5bff]",
      icon: Users,
    },
    {
      label: "Active Customers",
      value: numberFormatter.format(stats.activeCustomers),
      accent: "bg-[#e7f6ef] text-[#1d7a4c]",
      icon: UserCheck,
    },
    {
      label: "Inactive Customers",
      value: numberFormatter.format(stats.inactiveCustomers),
      accent: "bg-[#ffeef0] text-[#c62828]",
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="rounded-[28px] border border-[#e5eaf4] bg-white px-6 py-5 shadow-none"
        >
          <CardContent className="flex items-center gap-4 p-0">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-3xl font-medium text-slate-900">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

