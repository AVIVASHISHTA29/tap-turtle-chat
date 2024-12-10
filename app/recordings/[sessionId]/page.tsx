// app/recordings/[sessionId]/page.tsx

import { RecordingPlayer } from "@/components/app/recording/recording-player";
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
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">
        Replay Session: {sessionId}
      </h1>
      <RecordingPlayer events={events} />
    </div>
  );
}
