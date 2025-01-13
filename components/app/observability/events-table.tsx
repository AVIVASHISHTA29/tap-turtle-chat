"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ObservabilityEvent } from "@/redux/features/observability/api";
import { useState } from "react";
import { RequestDetailsDrawer } from "./request-details-drawer";

interface Event {
  event_id: string;
  session_id: string;
  event_type: string;
  method: string;
  url: string;
  status: number;
  timestamp: string;
  request_body?: Record<string, unknown>;
  response_body?: Record<string, unknown>;
  request_headers?: Record<string, string>;
  response_headers?: Record<string, string>;
}

interface EventsTableProps {
  events: Event[];
  showSessionId?: boolean;
}

export function EventsTable({
  events,
  showSessionId = true,
}: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {showSessionId && <TableHead>Session</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.event_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedEvent(event)}
            >
              {showSessionId && (
                <TableCell className="font-medium">
                  {event.session_id.slice(0, 8)}...
                </TableCell>
              )}
              <TableCell className="capitalize">{event.event_type}</TableCell>
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

      {selectedEvent && (
        <RequestDetailsDrawer
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent as ObservabilityEvent}
        />
      )}
    </>
  );
}
