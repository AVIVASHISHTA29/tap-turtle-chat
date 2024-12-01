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

const generateHeatmapData = () => {
  // Generate base points for key areas
  const keyAreas = [
    { x: 50, y: 30, value: 0.9 }, // Hero CTA
    { x: 85, y: 45, value: 0.7 }, // Sidebar
    { x: 50, y: 60, value: 0.8 }, // Main content
    { x: 0, y: 0, value: 1 }, // Top left corner
    { x: 100, y: 0, value: 1 }, // Top right corner
    { x: 0, y: 100, value: 1 }, // Bottom left corner
    { x: 100, y: 100, value: 1 }, // Bottom right corner
  ];

  // Generate additional points around key areas
  const data = keyAreas.flatMap((area) => {
    const points = [];
    // Add the key point
    points.push(area);

    // Add surrounding points with varying intensities
    for (let i = 0; i < 15; i++) {
      const radius = Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.max(0, Math.min(100, area.x + Math.cos(angle) * radius));
      const y = Math.max(0, Math.min(100, area.y + Math.sin(angle) * radius));
      const value = area.value * (1 - radius / 20); // Decrease intensity with distance
      points.push({ x, y, value });
    }
    return points;
  });

  // Add some random background noise
  for (let i = 0; i < 50; i++) {
    data.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      value: Math.random() * 0.3,
    });
  }

  return { data };
};

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
  description:
    "Get user engagement metrics including click statistics and interaction data. Use this for general click analytics when users want traditional charts.",
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
  description:
    "Get page heatmap data showing spatial distribution of user clicks. Only use when heatmap visualization is specifically requested or most appropriate for spatial analysis.",
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
