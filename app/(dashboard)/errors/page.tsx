"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell className="font-medium">
                    {event.session_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="capitalize">
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
        </CardContent>
      </Card>
    </div>
  );
}
