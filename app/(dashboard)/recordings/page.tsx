// app/recordings/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MarkdownRenderer from "@/components/ui/markdown";
import { useGetRecordingGroupAnalysisMutation } from "@/redux/features/recordings/api";
import { RootState } from "@/redux/store";
import { FileSearch, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-4">
    <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
    <h2 className="text-2xl font-semibold text-gray-600 mb-2">{message}</h2>
  </div>
);

export default function RecordingsPage() {
  const { groupAnalysis, selectedProject, selectedRecordings } = useSelector(
    (state: RootState) => state.projects
  );
  const [getRecordingGroupAnalysis, { data, isLoading }] =
    useGetRecordingGroupAnalysisMutation();

  const handleGroupAnalysis = async () => {
    if (!selectedProject?.project_id || !selectedRecordings?.length) return;
    await getRecordingGroupAnalysis({
      projectId: selectedProject.project_id,
      sessionIds: selectedRecordings,
    });
  };

  if (!selectedProject) {
    return <EmptyState message="Please select a project to view recordings" />;
  }

  if (groupAnalysis && selectedRecordings?.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Group Session Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Select multiple recordings from the sidebar to perform a
            comprehensive group analysis
          </p>
        </div>
      </div>
    );
  }

  if (groupAnalysis && selectedRecordings?.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        {data ? (
          <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle>
                Analysis of {selectedRecordings.length} Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                <MarkdownRenderer
                  content={data.analysis}
                  className="prose prose-slate md:prose-lg max-w-none"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Ready to Analyze</h3>
              <p className="text-muted-foreground">
                AI will analyze {selectedRecordings.length} selected recordings
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGroupAnalysis}
              disabled={isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Start Analysis"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Session Recordings
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a recording from the sidebar to view detailed session
          information
        </p>
      </div>
    </div>
  );
}
