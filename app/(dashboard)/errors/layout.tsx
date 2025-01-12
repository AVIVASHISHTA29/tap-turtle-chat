"use client";

import ObservabilitySessionCard from "@/components/app/observability/observability-session-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useGetObservabilitySessionsQuery } from "@/redux/features/observability/api";
import { RootState } from "@/redux/store";
import { Activity, FileSearch, List, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const NoSessions = () => (
  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
    <FileSearch className="h-8 w-8 text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground">No sessions found</p>
  </div>
);

export default function ErrorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const router = useRouter();
  const pathname = usePathname();

  const { data: sessions, isLoading } = useGetObservabilitySessionsQuery(
    { projectId: selectedProject?.project_id },
    { skip: !selectedProject }
  );

  useEffect(() => {
    if (!selectedProject) {
      router.push("/projects");
    }
  }, [selectedProject, router]);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold text-gray-600">
          Please select a project to view observability data
        </h2>
      </div>
    );
  }

  const maxHeightClass =
    state === "expanded"
      ? "max-h-[calc(100vh-70px)]"
      : "max-h-[calc(100vh-55px)]";

  const isSessionsView = pathname.includes("/sessions");

  return (
    <div className={`flex h-full ${maxHeightClass}`}>
      <aside className="w-80 border-r border-border bg-card ">
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">API Observability</h2>
          </div>
          <div className="p-4 border-b">
            <div className="space-y-2">
              <Button
                variant={!isSessionsView ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push("/errors")}
              >
                <Activity className="mr-2 h-4 w-4" />
                All Events
              </Button>
              <Button
                variant={isSessionsView ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push("/errors/sessions")}
              >
                <List className="mr-2 h-4 w-4" />
                By Sessions
              </Button>
            </div>
          </div>
          {isSessionsView && (
            <>
              <div className="flex items-center justify-between border-b p-4 ">
                <h3 className="font-medium text-sm">Sessions</h3>
              </div>
              <ScrollArea className="max-h-[550px] overflow-y-auto">
                <div className="p-4">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      {!sessions || sessions.length === 0 ? (
                        <NoSessions />
                      ) : (
                        <div className="space-y-2">
                          {sessions.map((session) => (
                            <ObservabilitySessionCard
                              key={session.session_id}
                              session={session}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
