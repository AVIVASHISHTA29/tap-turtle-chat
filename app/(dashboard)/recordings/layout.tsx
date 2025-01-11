"use client";

import SessionCard from "@/components/app/recording/session-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useGetRecordingSessionsQuery } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

export default function RecordingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { selectedProject, groupAnalysis } = useSelector(
    (state: RootState) => state.projects
  );

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
                <SessionCard
                  key={session.session_id}
                  session={session}
                  groupAnalysis={groupAnalysis}
                />
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
