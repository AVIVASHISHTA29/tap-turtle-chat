"use client";

import SessionCard from "@/components/app/recording/session-card";
import { TimeFilter } from "@/components/app/recording/time-filter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import {
  clearSelectedRecordings,
  setAllSelectedRecordings,
} from "@/redux/features/projects/slice";
import { useGetRecordingSessionsQuery } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { FileSearch, Inbox, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const ITEMS_PER_PAGE = 20;

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const NoRecordings = () => (
  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
    <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground">No recordings found</p>
  </div>
);

export default function RecordingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { selectedProject, groupAnalysis, selectedRecordings } = useSelector(
    (state: RootState) => state.projects
  );
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(0);
  const [timeFilter, setTimeFilter] = useState<{
    timeFilter?: "30m" | "1h" | "6h" | "1d" | "1w" | "custom";
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, isLoading, isFetching } = useGetRecordingSessionsQuery(
    {
      projectId: selectedProject?.project_id ?? "",
      offset: currentPage * ITEMS_PER_PAGE,
      limit: ITEMS_PER_PAGE,
      ...timeFilter,
    },
    {
      skip: !selectedProject,
    }
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && data?.hasMore && !isFetching) {
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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [timeFilter]);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold text-gray-600">
          Please select a project to view recordings
        </h2>
      </div>
    );
  }

  const maxHeightClass =
    state === "expanded"
      ? "max-h-[calc(100vh-70px)]"
      : "max-h-[calc(100vh-55px)]";

  const toggleSelectAll = () => {
    if (data?.sessions?.length === selectedRecordings?.length) {
      dispatch(clearSelectedRecordings());
    } else {
      dispatch(
        setAllSelectedRecordings(
          data?.sessions.map((session) => session.session_id)
        )
      );
    }
  };

  return (
    <div className={`flex h-full ${maxHeightClass}`}>
      <aside className="w-80 border-r border-border bg-card">
        <div className="flex items-center justify-start gap-4 border-b p-4">
          <TimeFilter onFilterChange={setTimeFilter} />
          {groupAnalysis && (
            <Button
              variant={
                data?.sessions?.length === selectedRecordings?.length
                  ? "destructive"
                  : "outline"
              }
              size="sm"
              onClick={toggleSelectAll}
            >
              {data?.sessions?.length === selectedRecordings?.length ? (
                <>
                  <X className="h-4 w-4" /> Deselect All
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" /> Select All
                </>
              )}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[calc(100%-65px)]">
          <div className="p-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {data?.sessions?.length === 0 ? (
                  <NoRecordings />
                ) : (
                  <div className="space-y-2">
                    {data?.sessions?.map((session) => (
                      <SessionCard
                        key={session.session_id}
                        session={session}
                        groupAnalysis={groupAnalysis}
                      />
                    ))}
                  </div>
                )}
                <div ref={loadMoreRef} className="h-4 w-full">
                  {(isFetching || data?.hasMore) && <LoadingSpinner />}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
