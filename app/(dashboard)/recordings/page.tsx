// app/recordings/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MarkdownRenderer from "@/components/ui/markdown";
import { useGetRecordingGroupAnalysisMutation } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

export default function RecordingsPage() {
  const { groupAnalysis, selectedProject, selectedRecordings } = useSelector(
    (state: RootState) => state.projects
  );
  const [getRecordingGroupAnalysis, { data, isLoading }] =
    useGetRecordingGroupAnalysisMutation();

  const handleGroupAnalysis = async () => {
    await getRecordingGroupAnalysis({
      projectId: selectedProject?.project_id,
      sessionIds: selectedRecordings as string[],
    });
  };

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
      <div className="flex items-center justify-center h-full max-h-[calc(100vh-100px)] p-6">
        {data ? (
          <div className="flex items-center justify-center">
            <Card className="mt-4 max-h-[800px] overflow-y-auto">
              <CardHeader>
                <CardTitle>Group Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer
                  content={data.analysis}
                  className="prose md:prose-2xl"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground mb-4">
              Let AI analyze the group of recordings for you
            </p>
            <Button onClick={handleGroupAnalysis} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  Analyzing...
                </>
              ) : (
                "Analyze Group Recordings"
              )}
            </Button>
          </div>
        )}
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
