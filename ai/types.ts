export enum ChartType {
  AREA = "area",
  BAR = "bar",
  PIE = "pie",
  LINE = "line",
  RADAR = "radar",
  SCATTER = "scatter",
}

export enum AnalyticsTool {
  VISITORS_TREND = "visitors_trend",
  DEVICE_DISTRIBUTION = "device_distribution",
  BROWSER_ANALYTICS = "browser_analytics",
  USER_ENGAGEMENT = "user_engagement",
  PAGE_PERFORMANCE = "page_performance",
  PAGE_HEATMAP = "page_heatmap",
}

export interface VisitorTrendData {
  date: string;
  visitors: number;
  pageviews: number;
  bounceRate: number;
  avgDuration: number;
}

export interface DistributionData {
  name: string;
  value: number;
}

export interface PagePerformanceData {
  page: string;
  loadTime: number;
  bounceRate: number;
  conversion: number;
}

export interface HeatmapData {
  x: number;
  y: number;
  value: number;
}
