"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface RevenueExpensesChartProps {
  data: Array<{
    month: string;
    payments: number;
    expenses: number;
  }>;
}

export function RevenueExpensesChart({ data }: RevenueExpensesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: data.map((item) => item.month),
        datasets: [
          {
            label: "Expenses",
            data: data.map((item) => item.expenses),
            backgroundColor: "#ef4444",
            borderColor: "#ef4444",
            borderWidth: 0,
          },
          {
            label: "Payments",
            data: data.map((item) => item.payments),
            backgroundColor: "#16a34a",
            borderColor: "#16a34a",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return `Rs ${Number(value).toLocaleString()}`;
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = new Intl.NumberFormat("en-PK", {
                  style: "currency",
                  currency: "PKR",
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <Card className="rounded-xl border border-[#e5eaf4] bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent className="relative h-80">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

