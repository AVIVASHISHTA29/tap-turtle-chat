/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetProjectAnalyticsQuery } from "@/redux/features/projects/api";
import { RootState } from "@/redux/store";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  Monitor,
  MousePointer,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface BrowserData {
  browser: string;
  count: number;
}

interface ClickData {
  css_selector: string;
  count: number;
  last_metadata: string | null;
}

interface HourlyData {
  hour: string;
  count: number;
}

interface PageViewData {
  page_url: string;
  views: number;
  avg_duration: number;
  unique_visitors: number;
}

interface RecordingData {
  total: number;
  avgDuration: number;
  totalInteractions: number;
  durationDistribution: Array<{
    duration_range: string;
    count: number;
  }>;
}

interface Analytics {
  events: Array<{
    event_type: string;
    count: number;
  }>;
  timeSeries: Array<{
    hour: string;
    event_type: string;
    count: number;
  }>;
  clicks: ClickData[];
  sessions: {
    total_sessions: number;
    sessions_last_24h: number;
    sessions_last_7d: number;
    avg_viewport_width: number;
    avg_viewport_height: number;
  };
  browsers: BrowserData[];
  pageViews: PageViewData[];
  hourlyPattern: HourlyData[];
  recordings: RecordingData;
}

interface TooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color: string;
  }[];
  label?: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "< 1 min";
  return `${minutes} min${minutes > 1 ? "s" : ""}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

// Add new color constants
const CHART_COLORS = {
  click: "#3b82f6",
  scroll: "#22c55e",
  mouse_move: "#f59e0b",
  dom_load: "#f43f5e",
  dom_unload: "#6366f1",
};

const BROWSER_COLORS = ["#3b82f6", "#06b6d4", "#f59e0b", "#8b5cf6", "#6366f1"];

// Add custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Calculate session growth
const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

export default function Page() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const {
    data: analytics,
    isLoading,
    refetch,
    isFetching,
  } = useGetProjectAnalyticsQuery(selectedProject?.project_id ?? "", {
    skip: !selectedProject,
  }) as {
    data: Analytics | undefined;
    isLoading: boolean;
    refetch: () => void;
    isFetching: boolean;
  };

  // Process time series data
  const timeSeriesData =
    analytics?.timeSeries
      .reduce<ChartDataPoint[]>((acc, item) => {
        const date = new Date(item.hour);
        const dateStr = date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          hour12: true,
        });

        let existingPoint = acc.find((p) => p.date === dateStr);
        if (!existingPoint) {
          existingPoint = {
            date: dateStr,
            click: 0,
            scroll: 0,
            mouse_move: 0,
            dom_load: 0,
            dom_unload: 0,
          };
          acc.push(existingPoint);
        }

        existingPoint[item.event_type] = Number(item.count);
        return acc;
      }, [])
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ) || [];

  // Process browser data
  const processedBrowsers: BrowserData[] = [...(analytics?.browsers || [])];

  // Process hourly pattern data
  const processedHourlyPattern: HourlyData[] = [
    ...(analytics?.hourlyPattern || []),
  ]
    .map((h) => ({
      hour: `${String(h.hour).padStart(2, "0")}:00`,
      count: Number(h.count),
    }))
    .sort(
      (a, b) => Number(a.hour.split(":")[0]) - Number(b.hour.split(":")[0])
    );

  // Process click data
  const processedClicks: ClickData[] = [...(analytics?.clicks || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold text-gray-600">
          Please select a project to view analytics
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Ensure we have data before rendering
  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Analytics for {selectedProject.project_name}
        </h1>
        <Button
          onClick={() => refetch()}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enhanced Session Overview */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Session Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Sessions Card */}
              <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-muted-foreground">
                    Total Sessions
                  </p>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {analytics.sessions.total_sessions.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {calculateGrowth(
                    analytics.sessions.sessions_last_24h,
                    analytics.sessions.sessions_last_24h / 2
                  ) > 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      calculateGrowth(
                        analytics.sessions.sessions_last_24h,
                        analytics.sessions.sessions_last_24h / 2
                      ) > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {Math.abs(
                      calculateGrowth(
                        analytics.sessions.sessions_last_24h,
                        analytics.sessions.sessions_last_24h / 2
                      )
                    ).toFixed(1)}
                    % from last period
                  </span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-muted-foreground">Last 24 Hours</p>
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {analytics.sessions.sessions_last_24h.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.sessions.sessions_last_7d.toLocaleString()} this
                  week
                </p>
              </div>

              {/* Average Viewport */}
              <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-muted-foreground">Avg. Viewport</p>
                  <Monitor className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(analytics.sessions.avg_viewport_width)}x
                  {Math.round(analytics.sessions.avg_viewport_height)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Most common screen size
                </p>
              </div>

              {/* Interaction Rate */}
              <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-muted-foreground">
                    Interaction Rate
                  </p>
                  <MousePointer className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">
                  {(
                    analytics.events.reduce(
                      (acc: number, curr: any) => acc + Number(curr.count),
                      0
                    ) / analytics.sessions.total_sessions
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Events per session
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Recording Analytics Card */}
        {analytics?.recordings && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Recording Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recording Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Session Duration Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.recordings.durationDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="duration_range" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                        width={60}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recording Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Recording Statistics
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Recordings
                      </span>
                      <span className="text-lg font-semibold">
                        {analytics.recordings.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avg. Duration
                      </span>
                      <span className="text-lg font-semibold">
                        {formatDuration(analytics.recordings.avgDuration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Interactions
                      </span>
                      <span className="text-lg font-semibold">
                        {analytics.recordings.totalInteractions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browser Distribution */}
        {processedBrowsers.length > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Browser Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedBrowsers}
                    dataKey="count"
                    nameKey="browser"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {processedBrowsers.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BROWSER_COLORS[index % BROWSER_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Events Over Time */}
        {timeSeriesData.length > 0 && (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Events Over Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={60}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {[
                    "click",
                    "scroll",
                    "mouse_move",
                    "dom_load",
                    "dom_unload",
                  ].map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      stroke={CHART_COLORS[key as keyof typeof CHART_COLORS]}
                      fill={CHART_COLORS[key as keyof typeof CHART_COLORS]}
                      fillOpacity={0.3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Most Clicked Elements */}
        {processedClicks.length > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Most Clicked Elements</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedClicks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="css_selector"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.click}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Pages */}
        {analytics.pageViews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.pageViews.map((page, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {page.page_url}
                      </span>
                      <span className="text-sm font-semibold">
                        {page.views.toLocaleString()} views
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {page.unique_visitors.toLocaleString()} visitors
                      </span>
                      <span>
                        Avg. time: {formatDuration(page.avg_duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Activity Pattern */}
        {processedHourlyPattern.length > 0 && (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Daily Activity Pattern</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedHourlyPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) => value.toLocaleString()}
                    width={60}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
