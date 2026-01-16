"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  LineController,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface CylinderUsageTrendChartProps {
  data: Array<{
    month: string;
    cylinders: number;
  }>;
}

export function CylinderUsageTrendChart({ data }: CylinderUsageTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: data.map((item) => item.month),
        datasets: [
          {
            label: "Cylinders",
            data: data.map((item) => item.cylinders),
            borderColor: "#2563eb",
            backgroundColor: "#2563eb",
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            fill: false,
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
              precision: 0,
              callback: function (value) {
                return Math.round(Number(value)).toString();
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
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
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
        <CardTitle className="text-lg font-semibold text-slate-900">Cylinder Usage Trend</CardTitle>
      </CardHeader>
      <CardContent className="relative h-72">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

