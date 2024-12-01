/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChartType } from "@/ai/types";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsVisualizationProps {
  type: string;
  data: Record<string, any>[];
  title: string;
  insight: string;
  preferredChart?: ChartType;
}

export function AnalyticsVisualization({
  data,
  title,
  insight,
  preferredChart,
}: AnalyticsVisualizationProps) {
  const [selectedChart, setSelectedChart] = useState<ChartType>(
    preferredChart || ChartType.BAR
  );

  const renderChart = () => {
    const chart = (() => {
      switch (selectedChart) {
        case ChartType.AREA:
          return (
            <AreaChart data={data}>
              <XAxis
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
              />
              <YAxis />
              <Tooltip />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId={index.toString()}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                  />
                ))}
            </AreaChart>
          );

        case ChartType.BAR:
          return (
            <BarChart data={data}>
              <XAxis
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
              />
              <YAxis />
              <Tooltip />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                  />
                ))}
            </BarChart>
          );

        case ChartType.PIE:
          return (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
                fill="#8884d8"
              />
              <Tooltip />
            </PieChart>
          );

        case ChartType.LINE:
          return (
            <LineChart data={data}>
              <XAxis
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
              />
              <YAxis />
              <Tooltip />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                  />
                ))}
            </LineChart>
          );

        case ChartType.RADAR:
          return (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <Radar
                name="Value"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          );

        case ChartType.SCATTER:
          return (
            <ScatterChart>
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Scatter data={data} fill="#8884d8" />
            </ScatterChart>
          );

        default:
          return (
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          );
      }
    })();

    return (
      <ResponsiveContainer width="100%" height={400}>
        {chart}
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Select
            value={selectedChart}
            onValueChange={(value) => setSelectedChart(value as ChartType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ChartType).map((chartType) => (
                <SelectItem key={chartType} value={chartType}>
                  {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{insight}</p>
      </div>
      {renderChart()}
    </Card>
  );
}
