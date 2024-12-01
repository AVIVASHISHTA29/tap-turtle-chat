export enum AnalyticsTool {
  VISITORS_TREND = "getVisitorsTrend",
  DEVICE_DISTRIBUTION = "getDeviceDistribution",
  BROWSER_ANALYTICS = "getBrowserAnalytics",
  USER_ENGAGEMENT = "getUserEngagement",
  PAGE_PERFORMANCE = "getPagePerformance",
  PAGE_HEATMAP = "getPageHeatmap",
}

export enum ChartType {
  AREA = "area",
  BAR = "bar",
  PIE = "pie",
  LINE = "line",
  RADAR = "radar",
  SCATTER = "scatter",
}

export interface VisualizationResult {
  type: AnalyticsTool;
  data: unknown;
  title: string;
  insight: string;
  preferredChart?: ChartType;
}
