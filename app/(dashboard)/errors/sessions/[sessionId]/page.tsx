"use client";

import { EventsTable } from "@/components/app/observability/events-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ObservabilityEvent,
  useGetObservabilityEventsQuery,
  useGetObservabilitySessionsQuery,
} from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

export default function SessionPage() {
  const { sessionId } = useParams();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allEvents, setAllEvents] = useState<ObservabilityEvent[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useGetObservabilitySessionsQuery(
    { projectId: selectedProject?.project_id },
    { skip: !selectedProject }
  );

  const { data, isLoading: isLoadingEvents } = useGetObservabilityEventsQuery(
    {
      projectId: selectedProject?.project_id,
      sessionId: sessionId as string,
      cursor,
    },
    { skip: !selectedProject || !sessionId }
  );

  const session = sessions?.find((s) => s.session_id === sessionId);

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

  if (isLoadingEvents && !cursor) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Started:{" "}
              {new Date(session?.start_timestamp || "").toLocaleString()}
            </div>
            {session?.user_agent && <div>User Agent: {session.user_agent}</div>}
            {session?.referrer && <div>Referrer: {session.referrer}</div>}
          </div>
          <Link href={`/recordings/${sessionId}`}>
            <Button variant="outline">
              <Camera className="w-4 h-4" />
              View Recording
            </Button>
          </Link>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Requests & Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={allEvents} showSessionId={false} />
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
