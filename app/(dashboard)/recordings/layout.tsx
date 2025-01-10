"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
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
  Chrome,
  Globe,
  Globe2,
  Info,
  Laptop,
  Loader2,
  Monitor,
  MonitorSmartphone,
  MousePointer2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { UAParser } from "ua-parser-js";

const parser = new UAParser();

export default function RecordingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const pathname = usePathname();

  const { data, isLoading, isFetching } = useGetRecordingSessionsQuery(
    {
      projectId: selectedProject?.project_id ?? "",
      offset: currentPage * 20,
      limit: 20,
    },
    {
      skip: !selectedProject,
    }
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && data?.hasMore && !isFetching) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = loadMoreRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [data?.hasMore, isFetching]);

  const getBrowserIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe2 className="h-3 w-3" />;
    parser.setUA(userAgent);
    const browserName = parser.getBrowser().name?.toLowerCase() ?? "";

    switch (browserName) {
      case "chrome":
        return <Chrome className="h-3 w-3" />;
      case "firefox":
        return <Monitor className="h-3 w-3" />;
      case "safari":
        return <MonitorSmartphone className="h-3 w-3" />;
      default:
        return <Globe2 className="h-3 w-3" />;
    }
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";
    parser.setUA(userAgent);
    return parser.getDevice().type === "mobile" ||
      parser.getDevice().type === "tablet"
      ? "Mobile"
      : "Desktop";
  };

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
    <div
      className={`flex h-full  ${
        state === "expanded"
          ? "max-h-[calc(100vh-70px)]"
          : "max-h-[calc(100vh-55px)]"
      }`}
    >
      <div className="w-80 border-r border-border bg-card">
        <ScrollArea className="h-full max-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-2 gap-2">
              {data?.sessions?.map((session) => (
                <Link
                  key={session.session_id}
                  href={`/recordings/${session.session_id}`}
                >
                  <Card
                    className={`p-4 hover:bg-accent transition-colors cursor-pointer mb-4 ${
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
                          {getBrowserIcon(session.user_agent)}
                          {session.user_agent
                            ? (() => {
                                parser.setUA(session.user_agent);
                                return parser.getBrowser().name || "Unknown";
                              })()
                            : "Unknown"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Laptop className="h-3 w-3" />
                          {session.viewport_width}x{session.viewport_height}
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointer2 className="h-3 w-3" />
                          {getDeviceType(session.user_agent)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              <div ref={loadMoreRef} className="h-4 w-full">
                {(isFetching || data?.hasMore) && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
