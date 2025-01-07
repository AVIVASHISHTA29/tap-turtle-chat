"use client";

import { RecordingAnalysis } from "@/components/app/recording/recording-analysis";
import { RecordingPlayer } from "@/components/app/recording/recording-player";
import { SessionSummary } from "@/components/app/recording/session-summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import "@/styles/rrweb-player.css";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecordingSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/recording_events/${sessionId}`
        );
        if (!res.ok) {
          setEvents([]);
        } else {
          const data = await res.json();
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [sessionId]);

  if (!loading && !events) {
    return (
      <div className="container mx-auto p-8 max-w-[1400px]">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <div
              onClick={() => router.back()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </div>
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Recording not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-[1400px]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <div
            onClick={() => router.back()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </div>
        </Button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <>
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            <RecordingPlayer events={events as unknown[]} />
            <SessionSummary sessionId={sessionId as string} />
            <RecordingAnalysis sessionId={sessionId as string} />
          </>
        )}
      </div>
    </div>
  );
}
