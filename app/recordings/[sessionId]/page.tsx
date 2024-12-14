// app/recordings/[sessionId]/page.tsx

import { RecordingAnalysis } from "@/components/app/recording/recording-analysis";
import { RecordingPlayer } from "@/components/app/recording/recording-player";
import { Button } from "@/components/ui/button";
import "@/styles/rrweb-player.css";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

async function fetchEvents(sessionId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/recording_events/${sessionId}`
  );
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.events;
}

export default async function RecordingSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const events = await fetchEvents(sessionId);

  if (!events) {
    notFound();
  }

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recordings" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Recordings
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Session Recording: {sessionId}
        </h1>
      </div>

      <div className="space-y-6">
        <RecordingPlayer events={events} />
        <RecordingAnalysis sessionId={sessionId} />
      </div>
    </div>
  );
}
