"use client";

import { useEffect, useRef } from "react";
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CylinderStatus } from "@prisma/client";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const palette = ["#2563eb", "#0ea5e9", "#f59e0b", "#ef4444"];

type StatusDatum = {
  status: CylinderStatus;
  count: number;
};

interface CylinderStatusChartProps {
  data: StatusDatum[];
}

export function CylinderStatusChart({ data }: CylinderStatusChartProps) {
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
        labels: data.map((item) => item.status.replace("_", " ")),
        datasets: [
          {
            data: data.map((item) => item.count),
            backgroundColor: palette,
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
    <Card id="analytics" className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Fleet Distribution</CardTitle>
      </CardHeader>
      <CardContent className="relative h-72">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}

