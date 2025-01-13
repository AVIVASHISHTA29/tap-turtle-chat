"use client";

import { EventsTable } from "@/components/app/observability/events-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetObservabilityEventsQuery,
  useGetObservabilitySessionsQuery,
} from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";

export default function SessionPage() {
  const { sessionId } = useParams();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const { data: sessions } = useGetObservabilitySessionsQuery(
    { projectId: selectedProject?.project_id },
    { skip: !selectedProject }
  );

  const { data: events, isLoading: isLoadingEvents } =
    useGetObservabilityEventsQuery(
      {
        projectId: selectedProject?.project_id,
        sessionId: sessionId as string,
      },
      { skip: !selectedProject || !sessionId }
    );

  const session = sessions?.find((s) => s.session_id === sessionId);

  if (isLoadingEvents) {
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
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Requests & Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={events || []} showSessionId={false} />
        </CardContent>
      </Card>
    </div>
  );
}
