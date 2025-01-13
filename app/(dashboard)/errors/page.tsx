"use client";

import { EventsTable } from "@/components/app/observability/events-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetObservabilityEventsQuery } from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

export default function ErrorsPage() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const { data: events, isLoading } = useGetObservabilityEventsQuery(
    { projectId: selectedProject?.project_id },
    { skip: !selectedProject }
  );

  if (isLoading) {
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
          <EventsTable events={events || []} />
        </CardContent>
      </Card>
    </div>
  );
}
