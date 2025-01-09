"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DeviceInfo {
  client?: {
    type: string;
    name: string;
    version: string;
  };
  os?: {
    name: string;
    version: string;
    platform?: string;
  };
  device?: {
    type: string;
    brand: string;
    model: string;
  };
}

interface SessionData {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  end_timestamp: string | null;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string | null;
  referrer: string | null;
  device: DeviceInfo | null;
}

interface EventStats {
  total_clicks: number;
  total_scrolls: number;
  total_mousemoves: number;
  total_page_loads: number;
  first_event_time: string;
  last_event_time: string;
  total_events: number;
  unique_elements_interacted: string[];
  unique_selectors_interacted: string[];
}

interface PageNavigation {
  timestamp: string;
  metadata: string;
}

interface SessionSummaryData {
  session: SessionData;
  events: EventStats;
  pageNavigation: PageNavigation[];
}

export function SessionSummary({ summary }: { summary: SessionSummaryData }) {
  const formatDuration = (start: string, end: string) => {
    const duration =
      (new Date(end).getTime() - new Date(start).getTime()) / 60000;
    return `${duration.toFixed(2)} minutes`;
  };

  return (
    <div className="space-y-4">
      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>
            Basic session details and device information
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Browser & Device</h3>
              <p className="text-sm">
                {summary.session.device?.client?.name}{" "}
                {summary.session.device?.client?.version}
              </p>
              <p className="text-sm">
                {summary.session.device?.os?.name}{" "}
                {summary.session.device?.os?.version}
              </p>
              {summary.session.device?.device?.brand && (
                <p className="text-sm">
                  {summary.session.device.device.brand}{" "}
                  {summary.session.device.device.model}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Viewport</h3>
              <p className="text-sm">
                {summary.session.viewport_width} x{" "}
                {summary.session.viewport_height}
              </p>
              {summary.session.referrer && (
                <>
                  <h3 className="font-medium">Referrer</h3>
                  <p className="text-sm truncate">{summary.session.referrer}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction Statistics</CardTitle>
          <CardDescription>User activity during the session</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Clicks</p>
              <p className="text-2xl font-bold">
                {summary.events.total_clicks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Scrolls</p>
              <p className="text-2xl font-bold">
                {summary.events.total_scrolls}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Mouse Movements</p>
              <p className="text-2xl font-bold">
                {summary.events.total_mousemoves}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Page Loads</p>
              <p className="text-2xl font-bold">
                {summary.events.total_page_loads}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Session Duration</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-secondary-foreground text-secondary border-border">
                    <p>Time between first and last recorded event</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg">
              {new Date(summary.events.first_event_time).toLocaleString()} -{" "}
              {new Date(summary.events.last_event_time).toLocaleString()}
              <br />
              <span className="text-muted-foreground">
                (
                {formatDuration(
                  summary.events.first_event_time,
                  summary.events.last_event_time
                )}
                )
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Events</p>
              <p className="text-lg">{summary.events.total_events}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Unique Elements Interacted</p>
              <p className="text-lg">
                {summary.events.unique_elements_interacted.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Navigation Card */}
      {summary.pageNavigation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Page Navigation</CardTitle>
            <CardDescription>Pages visited during the session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.pageNavigation.map((nav, index) => (
                <div key={index} className="text-sm">
                  <span className="text-muted-foreground">
                    {new Date(nav.timestamp).toLocaleString()}
                  </span>
                  <p className="truncate">{nav.metadata}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
