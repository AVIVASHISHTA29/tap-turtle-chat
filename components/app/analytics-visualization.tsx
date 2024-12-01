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
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
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

  // Transform data for pie/radar charts if needed
  const transformedData = useMemo(() => {
    if (
      (selectedChart === ChartType.PIE || selectedChart === ChartType.RADAR) &&
      data[0] &&
      !data[0].hasOwnProperty("name")
    ) {
      // Get all numeric keys
      const numericKeys = Object.keys(data[0]).filter(
        (key) => typeof data[0][key] === "number"
      );

      // Use the latest data point for the pie chart
      const latestData = data[0];
      return numericKeys.map((key) => ({
        name: key,
        value: latestData[key],
      }));
    }
    return data;
  }, [data, selectedChart]);

  // Transform data for scatter plot
  const scatterData = useMemo(() => {
    if (selectedChart === ChartType.SCATTER && data[0]) {
      const numericKeys = Object.keys(data[0]).filter(
        (key) => typeof data[0][key] === "number"
      );
      if (numericKeys.length >= 2) {
        return data.map((item) => ({
          x: item[numericKeys[0]],
          y: item[numericKeys[1]],
          name: item.date || item.name || item.metric || item.page,
        }));
      }
    }
    return data;
  }, [data, selectedChart]);

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
                data={transformedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
                fill="#8884d8"
              >
                {transformedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${
                      index * (360 / transformedData.length)
                    }, 70%, 50%)`}
                  />
                ))}
              </Pie>
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
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="80%"
              data={transformedData}
            >
              {transformedData.map((_, index) => (
                <PolarGrid key={`grid-${index}`} />
              ))}
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar
                name="Values"
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
              <XAxis type="number" dataKey="x" name="x" />
              <YAxis type="number" dataKey="y" name="y" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={scatterData}
                fill="#8884d8"
                name="Values"
                line={{ stroke: "#8884d8" }}
              />
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
