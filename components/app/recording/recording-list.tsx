// components/recording-list.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface Session {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  end_timestamp: string | null;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string | null;
  referrer: string | null;
}

export function RecordingList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Page URL</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.session_id}>
              <TableCell className="font-medium">
                {session.session_id}
              </TableCell>
              <TableCell>{session.start_timestamp}</TableCell>
              <TableCell>{session.page_url}</TableCell>
              <TableCell>
                {session.viewport_width} x {session.viewport_height}
              </TableCell>
              <TableCell>
                <Button variant="link" asChild>
                  <Link href={`/recordings/${session.session_id}`}>
                    View Recording
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
