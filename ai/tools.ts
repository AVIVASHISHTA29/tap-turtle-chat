import { AnalyticsTool, ChartType } from "@/ai/types";
import { tool as createTool } from "ai";
import { z } from "zod";

// Helper functions to generate dummy data
const generateTimeSeriesData = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    visitors: Math.floor(Math.random() * 1000),
    pageviews: Math.floor(Math.random() * 2000),
    bounceRate: Math.floor(Math.random() * 100),
    avgDuration: Math.floor(Math.random() * 300),
  }));
};

const generateDeviceData = () => ({
  data: [
    { name: "Desktop", value: 45 },
    { name: "Mobile", value: 35 },
    { name: "Tablet", value: 20 },
  ],
});

const generateBrowserData = () => ({
  data: [
    { name: "Chrome", value: 55 },
    { name: "Safari", value: 25 },
    { name: "Firefox", value: 12 },
    { name: "Edge", value: 8 },
  ],
});

const generateUserEngagementData = () => ({
  data: [
    { metric: "Comments", value: 80 },
    { metric: "Shares", value: 65 },
    { metric: "Likes", value: 90 },
    { metric: "Saves", value: 45 },
    { metric: "Downloads", value: 70 },
  ],
});

const generatePagePerformanceData = () => ({
  data: [
    { page: "/home", loadTime: 1.2, bounceRate: 35, conversion: 4.5 },
    { page: "/products", loadTime: 1.8, bounceRate: 42, conversion: 3.2 },
    { page: "/blog", loadTime: 1.5, bounceRate: 38, conversion: 2.8 },
    { page: "/contact", loadTime: 1.1, bounceRate: 45, conversion: 1.9 },
  ],
});

const generateHeatmapData = () => ({
  data: [
    { x: 10, y: 5, value: 0.3 },
    { x: 20, y: 5, value: 0.4 },
    { x: 30, y: 5, value: 0.5 },

    { x: 50, y: 30, value: 1 },
    { x: 45, y: 25, value: 1 },
    { x: 55, y: 25, value: 1 },

    { x: 30, y: 50, value: 0.5 },
    { x: 50, y: 50, value: 0.8 },
    { x: 70, y: 50, value: 0.4 },

    { x: 85, y: 40, value: 1 },
    { x: 85, y: 50, value: 1 },
    { x: 85, y: 60, value: 1 },

    { x: 0, y: 0, value: 10 },
    { x: 0, y: 0, value: 10 },
    { x: 0, y: 0, value: 10 },

    { x: 20, y: 90, value: 0.3 },
    { x: 40, y: 90, value: 0.2 },
    { x: 60, y: 90, value: 0.3 },
    { x: 80, y: 90, value: 0.2 },

    { x: 40, y: 70, value: 0.6 },
    { x: 60, y: 70, value: 0.5 },
    { x: 30, y: 40, value: 0.4 },
    { x: 70, y: 40, value: 0.3 },
  ],
});

export const visitorsTrendTool = createTool({
  description: "Get visitor trends over time with multiple metrics",
  parameters: z.object({
    days: z.number().optional().default(7),
  }),
  execute: async function ({ days }) {
    return {
      type: AnalyticsTool.VISITORS_TREND,
      data: generateTimeSeriesData(days),
      title: `Visitor Trends - Last ${days} Days`,
      insight:
        "Visitor traffic shows a 15% increase compared to the previous period, with peak activity during weekends.",
      preferredChart: ChartType.AREA,
    };
  },
});

export const deviceDistributionTool = createTool({
  description: "Get device usage distribution",
  parameters: z.object({}),
  execute: async function () {
    const data = generateDeviceData();
    return {
      type: AnalyticsTool.DEVICE_DISTRIBUTION,
      data: data.data,
      title: "Device Distribution",
      insight:
        "Mobile usage has increased by 8% this month, suggesting a need to optimize mobile experience.",
      preferredChart: ChartType.PIE,
    };
  },
});

export const browserAnalyticsTool = createTool({
  description: "Get browser usage analytics",
  parameters: z.object({}),
  execute: async function () {
    const data = generateBrowserData();
    return {
      type: AnalyticsTool.BROWSER_ANALYTICS,
      data: data.data,
      title: "Browser Distribution",
      insight:
        "Chrome dominates with 55% share. Consider prioritizing Chrome-specific optimizations.",
      preferredChart: ChartType.BAR,
    };
  },
});

export const userEngagementTool = createTool({
  description: "Get user engagement metrics",
  parameters: z.object({}),
  execute: async function () {
    const data = generateUserEngagementData();
    return {
      type: AnalyticsTool.USER_ENGAGEMENT,
      data: data.data,
      title: "User Engagement Metrics",
      insight:
        "Comments and likes show strong engagement. Consider promoting sharing features more prominently.",
      preferredChart: ChartType.LINE,
    };
  },
});

export const pagePerformanceTool = createTool({
  description: "Get page performance metrics",
  parameters: z.object({}),
  execute: async function () {
    const data = generatePagePerformanceData();
    return {
      type: AnalyticsTool.PAGE_PERFORMANCE,
      data: data.data,
      title: "Page Performance Metrics",
      insight:
        "The products page has a higher bounce rate. Consider optimizing page load time and content structure.",
      preferredChart: ChartType.BAR,
    };
  },
});

export const pageHeatmapTool = createTool({
  description: "Get page heatmap data showing user click patterns",
  parameters: z.object({
    page: z.string().optional().default("home"),
  }),
  execute: async function ({ page }) {
    const data = generateHeatmapData();
    return {
      type: AnalyticsTool.PAGE_HEATMAP,
      data: data.data,
      title: `Click Heatmap - ${page} page`,
      insight:
        "The hero section CTA and main navigation receive the most clicks, while the footer area shows moderate engagement.",
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
