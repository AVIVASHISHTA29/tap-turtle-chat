// app/recordings/page.tsx
import { RecordingList } from "@/components/app/recording/recording-list";

// Prevent static pre-rendering
export const dynamic = "force-dynamic";

async function fetchSessions() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/recording_sessions`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.statusText}`);
    }
    const data = await res.json();
    return data.sessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

export default async function RecordingsPage() {
  const sessions = await fetchSessions();

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Session Recordings</h1>
      </div>
      {sessions.length > 0 ? (
        <RecordingList sessions={sessions} />
      ) : (
        <p className="text-muted-foreground">No recordings found.</p>
      )}
    </div>
  );
}
