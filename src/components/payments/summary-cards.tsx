interface SummaryMetrics {
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  totalCylinders: number;
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "PKR", maximumFractionDigits: 0 });

const cards = [
  {
    key: "totalAmount",
    label: "Total Amount",
    accent: "text-slate-900",
    border: "border-[#e4e7f5]",
  },
  {
    key: "receivedAmount",
    label: "Received Amount",
    accent: "text-emerald-500",
    border: "border-[#e1f5eb]",
  },
  {
    key: "remainingAmount",
    label: "Remaining Amount",
    accent: "text-rose-500",
    border: "border-[#fde6ea]",
  },
  {
    key: "totalCylinders",
    label: "Total Cylinders",
    accent: "text-slate-900",
    border: "border-[#e4e7f5]",
  },
] as const;

export function PaymentSummaryCards({ totals }: { totals: SummaryMetrics }) {
  return (
    <div className="grid gap-4 rounded-[32px] border border-[#e5eaf4] bg-white px-4 py-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-[24px] border bg-[#f9fbff] px-5 py-5 text-sm font-semibold text-slate-500 ${card.border}`}
        >
          <div className="text-xs uppercase tracking-wide text-slate-400">{card.label}</div>
          <div className={`mt-3 text-2xl font-medium ${card.accent}`}>
            {card.key === "totalCylinders"
              ? totals.totalCylinders
              : currency.format(totals[card.key as keyof SummaryMetrics] ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
}

