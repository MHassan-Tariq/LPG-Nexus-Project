"use client";

import { useEffect, useRef } from "react";
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface CylinderTypeDistributionChartProps {
  data: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

const colors = ["#2563eb", "#16a34a", "#f59e0b"];

export function CylinderTypeDistributionChart({ data }: CylinderTypeDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: data.map((item) => `${item.label}: ${item.percentage}%`),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                const label = context.label || "";
                const value = context.parsed || 0;
                return `${label.split(":")[0]}: ${value} (${data[context.dataIndex].percentage}%)`;
              },
            },
          },
        },
        cutout: "65%",
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data]);

  return (
    <Card className="rounded-xl border border-[#e5eaf4] bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Cylinder Type Distribution</CardTitle>
      </CardHeader>
      <CardContent className="relative h-72">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

