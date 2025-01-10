"use client";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/ui/markdown";
import { useGetRecordingAnalysisMutation } from "@/redux/features/recordings/api";
import { Bot } from "lucide-react";

export function RecordingAnalysis({
  projectId,
  sessionId,
}: {
  projectId: string;
  sessionId: string;
}) {
  const [getRecordingAnalysis, { isLoading, data }] =
    useGetRecordingAnalysisMutation();

  return (
    <div className="space-y-4">
      <Button
        onClick={() => getRecordingAnalysis({ projectId, sessionId })}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Bot className="h-4 w-4" />
        {isLoading
          ? "Analyzing..."
          : data?.analysis
          ? "Regenerate"
          : "Generate AI Analysis"}
      </Button>

      {data?.analysis && (
        <div className="mt-4">
          <MarkdownRenderer
            content={data.analysis}
            className="prose md:prose-2xl"
          />
        </div>
      )}
    </div>
  );
}
