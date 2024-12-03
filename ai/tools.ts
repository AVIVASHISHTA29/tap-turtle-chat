import { AnalyticsTool, ChartType } from "@/ai/types";
import { tool as createTool } from "ai";
import { z } from "zod";

const chartTypeSchema = z
  .enum([
    ChartType.AREA,
    ChartType.BAR,
    ChartType.PIE,
    ChartType.LINE,
    ChartType.RADAR,
    ChartType.SCATTER,
  ])
  .optional();

const visitorTrendSchema = z.object({
  date: z.string(),
  visitors: z.number(),
  pageviews: z.number(),
  bounceRate: z.number(),
  avgDuration: z.number(),
});

const distributionSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const pagePerformanceSchema = z.object({
  page: z.string(),
  loadTime: z.number(),
  bounceRate: z.number(),
  conversion: z.number(),
});

const heatmapSchema = z.object({
  x: z.number(),
  y: z.number(),
  value: z.number(),
});

export const visitorsTrendTool = createTool({
  description: "Visualize visitor trends over time with multiple metrics",
  parameters: z.object({
    data: z.array(visitorTrendSchema),
    preferredChart: chartTypeSchema,
  }),
  execute: async function ({ data, preferredChart }) {
    return {
      type: AnalyticsTool.VISITORS_TREND,
      data,
      title: "Visitor Trends",
      preferredChart: preferredChart || ChartType.AREA,
    };
  },
});

export const deviceDistributionTool = createTool({
  description: "Visualize device usage distribution",
  parameters: z.object({
    data: z.array(distributionSchema),
    preferredChart: chartTypeSchema,
  }),
  execute: async function ({ data, preferredChart }) {
    return {
      type: AnalyticsTool.DEVICE_DISTRIBUTION,
      data,
      title: "Device Distribution",
      preferredChart: preferredChart || ChartType.PIE,
    };
  },
});

export const browserAnalyticsTool = createTool({
  description: "Visualize browser usage analytics",
  parameters: z.object({
    data: z.array(distributionSchema),
    preferredChart: chartTypeSchema,
  }),
  execute: async function ({ data, preferredChart }) {
    return {
      type: AnalyticsTool.BROWSER_ANALYTICS,
      data,
      title: "Browser Distribution",
      preferredChart: preferredChart || ChartType.BAR,
    };
  },
});

export const userEngagementTool = createTool({
  description: "Visualize user engagement metrics",
  parameters: z.object({
    data: z.array(distributionSchema),
    preferredChart: chartTypeSchema,
  }),
  execute: async function ({ data, preferredChart }) {
    return {
      type: AnalyticsTool.USER_ENGAGEMENT,
      data,
      title: "User Engagement Metrics",
      preferredChart: preferredChart || ChartType.LINE,
    };
  },
});

export const pagePerformanceTool = createTool({
  description: "Visualize page performance metrics",
  parameters: z.object({
    data: z.array(pagePerformanceSchema),
    preferredChart: chartTypeSchema,
  }),
  execute: async function ({ data, preferredChart }) {
    return {
      type: AnalyticsTool.PAGE_PERFORMANCE,
      data,
      title: "Page Performance Metrics",
      preferredChart: preferredChart || ChartType.BAR,
    };
  },
});

export const pageHeatmapTool = createTool({
  description: "Visualize click heatmap data",
  parameters: z.object({
    data: z.array(heatmapSchema),
    page: z.string().optional().default("home"),
  }),
  execute: async function ({ data, page }) {
    return {
      type: AnalyticsTool.PAGE_HEATMAP,
      data,
      title: `Click Heatmap - ${page} page`,
      isHeatmap: true,
    };
  },
});

export const tools = {
  getVisitorsTrend: visitorsTrendTool,
  getDeviceDistribution: deviceDistributionTool,
  getBrowserAnalytics: browserAnalyticsTool,
  getUserEngagement: userEngagementTool,
  getPagePerformance: pagePerformanceTool,
  getPageHeatmap: pageHeatmapTool,
};
