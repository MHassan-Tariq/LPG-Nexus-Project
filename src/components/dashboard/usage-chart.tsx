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

type UsageDatum = {
  month: string;
  ISSUE: number;
  RETURN: number;
  MAINTENANCE: number;
  INSPECTION: number;
};

interface UsageTrendChartProps {
  data: UsageDatum[];
}

const datasetMeta = [
  { key: "ISSUE", label: "Issued", color: "#2563eb" },
  { key: "RETURN", label: "Returned", color: "#16a34a" },
  { key: "MAINTENANCE", label: "Maintenance", color: "#f59e0b" },
  { key: "INSPECTION", label: "Inspection", color: "#ef4444" },
] as const;

export function UsageTrendChart({ data }: UsageTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: data.map((item) => item.month),
        datasets: datasetMeta.map((dataset) => ({
          label: dataset.label,
          data: data.map((item) => item[dataset.key]),
          borderColor: dataset.color,
          backgroundColor: dataset.color,
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5,
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom" as const,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Six Month Cylinder Flow</CardTitle>
      </CardHeader>
      <CardContent className="relative h-72">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

