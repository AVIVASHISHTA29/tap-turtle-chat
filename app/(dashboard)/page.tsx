"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetProjectAnalyticsQuery } from "@/redux/features/projects/api";
import { RootState } from "@/redux/store";
import { AreaChart, BarChart, DonutChart } from "@tremor/react";
import { Loader, RefreshCw, Users } from "lucide-react";
import { useSelector } from "react-redux";

interface ChartDataPoint {
  hour: string;
  click: number;
  scroll: number;
  mouse_move: number;
  dom_load: number;
  dom_unload: number;
}

interface BrowserData {
  browser: string;
  count: number;
}

interface ClickData {
  css_selector: string;
  count: number;
  last_metadata: string;
}

interface HourlyData {
  hour: string;
  count: number;
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
      <Loader className="h-4 w-4 animate-spin" />
    </div>
  );
}

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
  });

  // Debug logging
  console.log("Analytics Data:", {
    events: analytics?.events,
    timeSeries: analytics?.timeSeries,
    browsers: analytics?.browsers,
    sessions: analytics?.sessions,
    pageViews: analytics?.pageViews,
    hourlyPattern: analytics?.hourlyPattern,
  });

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

  const timeSeriesData = analytics.timeSeries.reduce<
    Record<string, ChartDataPoint>
  >((acc, item) => {
    const hour = new Date(item.hour).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        click: 0,
        scroll: 0,
        mouse_move: 0,
        dom_load: 0,
        dom_unload: 0,
      };
    }
    acc[hour][item.event_type as keyof Omit<ChartDataPoint, "hour">] = parseInt(
      item.count.toString()
    );
    return acc;
  }, {});

  const chartData = Object.values(timeSeriesData);

  // Convert string counts to numbers for all data
  const processedBrowsers: BrowserData[] = analytics.browsers.map((b) => ({
    ...b,
    count: parseInt(b.count.toString()),
  }));

  const processedHourlyPattern: HourlyData[] = analytics.hourlyPattern.map(
    (h) => ({
      hour: `${h.hour}:00`,
      count: parseInt(h.count.toString()),
    })
  );

  const processedClicks: ClickData[] = analytics.clicks.map((c) => ({
    ...c,
    count: parseInt(c.count.toString()),
  }));

  // Debug the transformed data
  console.log("Transformed Data:", {
    timeSeriesData: Object.values(timeSeriesData),
    eventTypes: analytics.events.map((e) => e.event_type),
  });

  const valueFormatter = (value: number) =>
    Intl.NumberFormat("us").format(value).toString();

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
        {/* Session Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Session Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold">
                  {analytics.sessions.total_sessions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last 24 Hours</p>
                <p className="text-2xl font-bold">
                  {analytics.sessions.sessions_last_24h.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last 7 Days</p>
                <p className="text-2xl font-bold">
                  {analytics.sessions.sessions_last_7d.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Viewport</p>
                <p className="text-lg">
                  {Math.round(analytics.sessions.avg_viewport_width)}x
                  {Math.round(analytics.sessions.avg_viewport_height)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Distribution */}
        {processedBrowsers.length > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Browser Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <DonutChart
                data={processedBrowsers}
                category="count"
                index="browser"
                valueFormatter={valueFormatter}
                colors={["blue", "cyan", "amber", "violet", "indigo"]}
                showLabel
                showAnimation
              />
            </CardContent>
          </Card>
        )}

        {/* Events Over Time */}
        {chartData.length > 0 && (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Events Over Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AreaChart
                data={chartData}
                index="hour"
                categories={[
                  "click",
                  "scroll",
                  "mouse_move",
                  "dom_load",
                  "dom_unload",
                ]}
                colors={["blue", "green", "amber", "rose", "indigo"]}
                valueFormatter={valueFormatter}
                yAxisWidth={60}
                showLegend
                showGridLines
                showAnimation
              />
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
              <BarChart
                data={processedClicks.slice(0, 5)}
                index="css_selector"
                categories={["count"]}
                colors={["blue"]}
                valueFormatter={valueFormatter}
                yAxisWidth={60}
                showLegend={false}
                showGridLines
                showAnimation
              />
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
              <BarChart
                data={processedHourlyPattern}
                index="hour"
                categories={["count"]}
                colors={["violet"]}
                valueFormatter={valueFormatter}
                yAxisWidth={60}
                showLegend={false}
                showGridLines
                showAnimation
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
