"use client";

import { RecordingAnalysis } from "@/components/app/recording/recording-analysis";
import { RecordingPlayer } from "@/components/app/recording/recording-player";
import { SessionSummary } from "@/components/app/recording/session-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGetRecordingEventsQuery,
  useGetRecordingSessionsQuery,
} from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Globe,
  Info,
  Laptop,
  Loader2,
  MousePointer2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

export default function RecordingSessionPage() {
  const { sessionId } = useParams();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const pathname = usePathname();

  const { data: sessions } = useGetRecordingSessionsQuery(
    selectedProject?.project_id ?? "",
    {
      skip: !selectedProject,
    }
  );

  const { data: events, isLoading } = useGetRecordingEventsQuery(
    {
      projectId: selectedProject?.project_id ?? "",
      sessionId: sessionId as string,
    },
    {
      skip: !selectedProject || !sessionId,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="animate-spin size-6" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Secondary Sidebar */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Session Recordings
          </h2>
        </div>
        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="p-4 space-y-2">
            {sessions?.map((session) => (
              <Link
                key={session.session_id}
                href={`/recordings/${session.session_id}`}
              >
                <Card
                  className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                    pathname === `/recordings/${session.session_id}`
                      ? "bg-accent"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[180px]">
                          {session.page_url}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-secondary-foreground text-secondary border-border">
                            <p>View session recording</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(
                          new Date(session.start_timestamp),
                          {
                            addSuffix: true,
                          }
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.end_timestamp
                          ? formatDistanceToNow(
                              new Date(session.end_timestamp),
                              {
                                addSuffix: true,
                              }
                            )
                          : "Ongoing"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Laptop className="h-3 w-3" />
                        {session.viewport_width}x{session.viewport_height}
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointer2 className="h-3 w-3" />
                        {session.user_agent ? "Desktop" : "Mobile"}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/recordings">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                All Recordings
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="recording" className="space-y-6">
            <TabsList>
              <TabsTrigger value="recording">Recording</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="recording" className="space-y-6">
              {events && <RecordingPlayer events={events} />}
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <SessionSummary
                projectId={selectedProject.project_id}
                sessionId={sessionId as string}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <RecordingAnalysis
                projectId={selectedProject.project_id}
                sessionId={sessionId as string}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
