"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetObservabilityEventsQuery,
  useGetObservabilitySessionsQuery,
} from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function SessionsPage() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { data: sessions, isLoading: isLoadingSessions } =
    useGetObservabilitySessionsQuery(
      { projectId: selectedProject?.project_id },
      { skip: !selectedProject }
    );

  const { data: sessionEvents, isLoading: isLoadingEvents } =
    useGetObservabilityEventsQuery(
      {
        projectId: selectedProject?.project_id,
        sessionId: expandedSession || undefined,
      },
      { skip: !selectedProject || !expandedSession }
    );

  if (isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions?.map((session) => (
        <Card key={session.session_id}>
          <Collapsible
            open={expandedSession === session.session_id}
            onOpenChange={() =>
              setExpandedSession(
                expandedSession === session.session_id
                  ? null
                  : session.session_id
              )
            }
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session {session.session_id}</CardTitle>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      expandedSession === session.session_id
                        ? "transform rotate-90"
                        : ""
                    }`}
                  />
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-left">
                  Started: {new Date(session.start_timestamp).toLocaleString()}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionEvents?.map((event) => (
                        <TableRow key={event.event_id}>
                          <TableCell className="font-medium">
                            {event.event_type}
                          </TableCell>
                          <TableCell>{event.method}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {event.url}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                event.status >= 400
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {event.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
