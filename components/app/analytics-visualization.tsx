"use client";

import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsVisualizationProps {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  title: string;
  insight: string;
}

export function AnalyticsVisualization({
  type,
  data,
  title,
  insight,
}: AnalyticsVisualizationProps) {
  console.log("Visualization Props:", { type, data, title, insight }); // Debug log

  const renderChart = () => {
    // Match the tool names instead of chart types
    switch (type) {
      case "getVisitorsTrend":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="visitors"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="pageviews"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "getDeviceDistribution":
      case "getBrowserAnalytics":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "getUserEngagement":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <Radar
                name="Engagement"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "getPagePerformance":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <XAxis dataKey="page" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="loadTime" fill="#8884d8" />
              <Bar dataKey="bounceRate" fill="#82ca9d" />
              <Bar dataKey="conversion" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        console.log("Unknown chart type:", type); // Debug log
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{insight}</p>
      </div>
      {renderChart()}
    </Card>
  );
}
