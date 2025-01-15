"use client";

import { EventsTable } from "@/components/app/observability/events-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ObservabilityEvent,
  useGetObservabilityEventsQuery,
} from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

export default function ErrorsPage() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allEvents, setAllEvents] = useState<ObservabilityEvent[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetObservabilityEventsQuery(
    { projectId: selectedProject?.project_id, cursor },
    { skip: !selectedProject }
  );

  useEffect(() => {
    if (data?.events) {
      setAllEvents((prev) =>
        cursor ? [...prev, ...data.events] : data.events
      );
    }
  }, [data?.events, cursor]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && data?.hasMore) {
          setCursor(data.nextCursor || undefined);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [data?.hasMore, data?.nextCursor]);

  if (isLoading && !cursor) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">All Events</h1>
        <p className="text-muted-foreground">
          View all API requests and responses across all sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Requests & Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={allEvents || []} />
          {data?.hasMore && (
            <div ref={loaderRef} className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
