// app/recordings/page.tsx
"use client";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

export default function RecordingsPage() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
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
