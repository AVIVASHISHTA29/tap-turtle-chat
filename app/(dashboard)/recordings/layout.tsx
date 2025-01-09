"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetRecordingSessionsQuery } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  Globe,
  Info,
  Laptop,
  Loader2,
  MousePointer2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";

export default function RecordingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const pathname = usePathname();

  const { data: sessions, isLoading } = useGetRecordingSessionsQuery(
    selectedProject?.project_id ?? "",
    {
      skip: !selectedProject,
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

  return (
    <div className="flex h-full max-h-screen">
      <div className="w-80 border-r border-border bg-card">
        <ScrollArea className="h-full max-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
          )}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
