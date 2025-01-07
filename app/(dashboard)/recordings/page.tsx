// app/recordings/page.tsx
"use client";

import { RecordingList } from "@/components/app/recording/recording-list";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

async function fetchSessions() {
  try {
    const res = await fetch("/api/recording_sessions", {
      cache: "no-store",
    });
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

export default function RecordingsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      const data = await fetchSessions();
      setSessions(data);
      setIsLoading(false);
    };

    loadSessions();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Session Recordings</h1>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length > 0 ? (
        <RecordingList sessions={sessions} />
      ) : (
        <p className="text-muted-foreground">No recordings found.</p>
      )}
    </div>
  );
}
