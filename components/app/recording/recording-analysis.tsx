"use client";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/ui/markdown";
import { Brain } from "lucide-react";
import { useState } from "react";

export function RecordingAnalysis({ sessionId }: { sessionId: string }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeRecording = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recording_analysis/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to analyze recording");
      }
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error analyzing recording:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={analyzeRecording}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Brain className="h-4 w-4" />
        {loading ? "Analyzing..." : "Analyze Recording"}
      </Button>

      {analysis && (
        <div className="mt-4">
          <MarkdownRenderer content={analysis} />
        </div>
      )}
    </div>
  );
}
