/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChartType } from "@/ai/types";
import { Card } from "@/components/ui/card";
import MarkdownRenderer from "@/components/ui/markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import { HeatmapVisualization } from "./heatmap-visualization";

interface AnalyticsVisualizationProps {
  type: string;
  data: Record<string, any>[];
  title: string;
  analysis: string;
  insight?: string;
  preferredChart?: ChartType;
  isHeatmap?: boolean;
  isSessionList?: boolean;
}

const getChartColors = (isDark = true) => ({
  primary: isDark ? "hsl(220 90% 50%)" : "hsl(220 85% 60%)",
  muted: isDark ? "hsl(210 15% 25%)" : "hsl(210 20% 95%)",
  background: isDark ? "hsl(240 10% 15%)" : "hsl(0 0% 100%)",
  foreground: isDark ? "hsl(0 0% 90%)" : "hsl(0 0% 10%)",
  accent: isDark ? "hsl(160 80% 50%)" : "hsl(160 70% 60%)",
  secondary: isDark ? "hsl(290 70% 50%)" : "hsl(290 80% 60%)",
  border: isDark ? "hsl(240 10% 30%)" : "hsl(210 20% 80%)",
  tooltip: {
    background: isDark ? "hsl(240 10% 20%)" : "hsl(0 0% 100%)",
    text: isDark ? "hsl(0 0% 90%)" : "hsl(0 0% 10%)",
    border: isDark ? "hsl(240 10% 30%)" : "hsl(210 20% 80%)",
  },
});

const generateColorPalette = (length: number) => {
  const colors = [
    "hsl(220 90% 50%)", // Vibrant blue
    "hsl(160 80% 50%)", // Green
    "hsl(290 70% 50%)", // Purple
    "hsl(44 90% 50%)", // Yellow
    "hsl(0 80% 50%)", // Red
    "hsl(31 91% 65%)", // Orange
    "hsl(292 91% 73%)", // Pink
  ];

  return Array.from({ length }, (_, i) => colors[i % colors.length]);
};

export function AnalyticsVisualization({
  data,
  title,
  analysis,
  insight,
  preferredChart,
  isHeatmap = false,
  isSessionList = false,
}: AnalyticsVisualizationProps) {
  const [selectedChart, setSelectedChart] = useState<ChartType>(
    preferredChart || ChartType.BAR
  );

  const chartColors = getChartColors();
  const colorPalette = generateColorPalette(10);

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
    // Add these common props for better mobile display
    const commonAxisProps = {
      tick: {
        fontSize: 12,
        fill: chartColors.foreground,
        stroke: "none",
      },
      stroke: chartColors.border,
      axisLine: {
        stroke: chartColors.border,
      },
      gridLines: {
        stroke: chartColors.border,
        opacity: 0.2,
      },
    };

    const commonTooltipProps = {
      contentStyle: {
        backgroundColor: chartColors.tooltip.background,
        borderColor: chartColors.tooltip.border,
        color: chartColors.tooltip.text,
        fontSize: "12px",
        padding: "8px",
        borderRadius: "6px",
        border: `1px solid ${chartColors.tooltip.border}`,
      },
      wrapperStyle: {
        zIndex: 1000,
        outline: "none",
      },
      cursor: {
        stroke: chartColors.border,
        strokeWidth: 1,
      },
    };

    const commonChartMargins = {
      top: 20,
      right: 30,
      left: 10,
      bottom: 60,
    };

    const chart = (() => {
      switch (selectedChart) {
        case ChartType.AREA:
          return (
            <AreaChart data={data} margin={commonChartMargins}>
              <XAxis
                {...commonAxisProps}
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis {...commonAxisProps} width={40} />
              <Tooltip {...commonTooltipProps} />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.border}
                opacity={0.2}
              />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId={index.toString()}
                    stroke={colorPalette[index]}
                    fill={colorPalette[index]}
                    fillOpacity={0.4}
                  />
                ))}
            </AreaChart>
          );

        case ChartType.BAR:
          return (
            <BarChart data={data} margin={commonChartMargins}>
              <XAxis
                {...commonAxisProps}
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tickMargin={30}
              />
              <YAxis {...commonAxisProps} width={50} />
              <Tooltip
                {...commonTooltipProps}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.border}
                opacity={0.2}
              />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colorPalette[index]}
                    fillOpacity={0.9}
                  />
                ))}
            </BarChart>
          );

        case ChartType.PIE:
          return (
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={transformedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={(entry) => entry.name}
                labelLine={false}
              >
                {transformedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette[index % colorPalette.length]}
                  />
                ))}
              </Pie>
              <Tooltip {...commonTooltipProps} />
            </PieChart>
          );

        case ChartType.LINE:
          return (
            <LineChart data={data} margin={commonChartMargins}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.border}
                opacity={0.2}
              />
              <XAxis
                {...commonAxisProps}
                dataKey={Object.keys(data[0]).find(
                  (key) =>
                    typeof data[0][key] === "string" ||
                    key.toLowerCase().includes("date")
                )}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis {...commonAxisProps} width={40} />
              <Tooltip {...commonTooltipProps} />
              {Object.keys(data[0])
                .filter((key) => typeof data[0][key] === "number")
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colorPalette[index]}
                    strokeWidth={2}
                    dot={false}
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
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <PolarGrid stroke={chartColors.border} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: chartColors.foreground, fontSize: 10 }}
              />
              <PolarRadiusAxis
                tick={{ fill: chartColors.foreground, fontSize: 10 }}
              />
              <Radar
                name="Values"
                dataKey="value"
                stroke={colorPalette[0]}
                fill={colorPalette[0]}
                fillOpacity={0.6}
              />
              <Tooltip {...commonTooltipProps} />
            </RadarChart>
          );

        case ChartType.SCATTER:
          return (
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis {...commonAxisProps} type="number" dataKey="x" name="x" />
              <YAxis {...commonAxisProps} type="number" dataKey="y" name="y" />
              <Tooltip {...commonTooltipProps} />
              <Scatter
                data={scatterData}
                fill={colorPalette[0]}
                name="Values"
                line={{ stroke: colorPalette[0] }}
              />
            </ScatterChart>
          );

        default:
          return null;
      }
    })();

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chart || <div>No chart available</div>}
      </ResponsiveContainer>
    );
  };

  if (isSessionList) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <h4 className="text-base md:text-lg font-semibold text-foreground">
          Here are a list of sessions based on your query
        </h4>
        {data.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "p-3 transition-colors",
              "cursor-pointer border-border",
              "group flex items-center justify-between"
            )}
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_BASE_URL}/recordings/${item.id}`,
                "_blank"
              )
            }
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                {item.heading}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {item.subHeading}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-transform group-hover:translate-x-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </Card>
        ))}
      </div>
    );
  }

  if (isHeatmap) {
    return (
      <Card className="p-3 md:p-6 bg-card">
        <div className="mb-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {insight}
          </p>
        </div>
        <div className="w-full aspect-video">
          <HeatmapVisualization
            data={data as { x: number; y: number; value: number }[]}
            width={800}
            height={600}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 bg-card">
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <Select
            value={selectedChart}
            onValueChange={(value) => setSelectedChart(value as ChartType)}
          >
            <SelectTrigger className="w-[140px] md:w-[180px]">
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
        <div className="w-full h-[400px] md:h-[500px]">{renderChart()}</div>

        {analysis && (
          <div className="mt-4 text-sm text-muted-foreground">
            <MarkdownRenderer content={analysis} />
          </div>
        )}
        {insight && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {insight}
          </p>
        )}
      </div>
    </Card>
  );
}
