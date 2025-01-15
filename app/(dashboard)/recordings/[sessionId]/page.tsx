"use client";

import { EventsTable } from "@/components/app/observability/events-table";
import { RecordingAnalysis } from "@/components/app/recording/recording-analysis";
import { RecordingPlayer } from "@/components/app/recording/recording-player";
import { SessionSummary } from "@/components/app/recording/session-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetObservabilityEventsQuery } from "@/redux/features/observability/api";
import {
  useGetRecordingEventsQuery,
  useGetSessionSummaryQuery,
} from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function RecordingSessionPage() {
  const { sessionId } = useParams();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [activeTab, setActiveTab] = useState("recording");

  const { data: events, isLoading: eventsLoading } = useGetRecordingEventsQuery(
    {
      projectId: selectedProject?.project_id ?? "",
      sessionId: sessionId as string,
    },
    {
      skip: !selectedProject || !sessionId,
    }
  );

  const { data: summary, isLoading: summaryLoading } =
    useGetSessionSummaryQuery(
      {
        projectId: selectedProject?.project_id ?? "",
        sessionId: sessionId as string,
      },
      {
        skip: !selectedProject || !sessionId || activeTab !== "summary",
      }
    );

  const { data: observabilityEvents, isLoading: observabilityLoading } =
    useGetObservabilityEventsQuery(
      {
        projectId: selectedProject?.project_id ?? "",
        sessionId: sessionId as string,
      },
      {
        skip: !selectedProject || !sessionId || activeTab !== "observability",
      }
    );

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold text-gray-600">
          Please select a project to view recordings
        </h2>
      </div>
    );
  }

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="animate-spin size-6" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-[800px] mx-auto space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="recording">Recording</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="observability">Observability</TabsTrigger>
          </TabsList>

          <TabsContent value="recording" className="space-y-6">
            {events && <RecordingPlayer events={events} />}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              summary && <SessionSummary summary={summary} />
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <RecordingAnalysis
              projectId={selectedProject.project_id}
              sessionId={sessionId as string}
            />
          </TabsContent>

          <TabsContent value="observability" className="space-y-6">
            {observabilityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              observabilityEvents && (
                <EventsTable
                  events={observabilityEvents}
                  showSessionId={false}
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
