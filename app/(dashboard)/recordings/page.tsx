// app/recordings/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

export default function RecordingsPage() {
  const { groupAnalysis, selectedProject, selectedRecordings } = useSelector(
    (state: RootState) => state.projects
  );
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold text-gray-600">
          Please select a project to view recordings
        </h2>
      </div>
    );
  } else if (groupAnalysis && selectedRecordings?.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-2xl font-semibold mb-6">
            Groups Session Analysis
          </h1>
          <p className="text-muted-foreground mb-4">
            Select as many recordings as possible to analyze group of recordings
          </p>
        </div>
      </div>
    );
  } else if (groupAnalysis && selectedRecordings?.length > 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Button>Analyze Group Recordings</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Session Recordings</h1>
        <p className="text-muted-foreground mb-4">
          Select a recording from the sidebar to view the session details.
        </p>
      </div>
    </div>
  );
}
