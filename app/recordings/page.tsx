// app/recordings/page.tsx
import { RecordingList } from "@/components/app/recording/recording-list";

async function fetchSessions() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/recording_sessions`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }
  const data = await res.json();
  return data.sessions;
}

export default async function RecordingsPage() {
  const sessions = await fetchSessions();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Recording Sessions</h1>
      <RecordingList sessions={sessions} />
    </div>
  );
}
