/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChartType } from "@/ai/types";
import { Card } from "@/components/ui/card";
import MarkdownRenderer from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { AnalyticsVisualization } from "./analytics-visualization";

interface AnalyticsMessageProps {
  message: Message;
}

export function AnalyticsMessage({ message }: AnalyticsMessageProps) {
  console.log("message", message);
  return (
    <Card
      className={cn(
        "mb-2 md:mb-4 p-2 md:p-4",
        message.role === "assistant" ? "bg-muted" : "bg-primary/5"
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm md:text-base font-medium">
          {message.role === "assistant" ? "AI Assistant" : "You"}
        </div>
        <MarkdownRenderer content={message.content} />

        {message.toolInvocations?.map((toolInvocation) => {
          if (toolInvocation.state === "result") {
            const result = toolInvocation.result as {
              title: string;
              insight: string;
              type: string;
              data: unknown;
              preferredChart?: ChartType;
              analysis: string;
            };

            return (
              <AnalyticsVisualization
                key={toolInvocation.toolCallId}
                type={toolInvocation.toolName}
                data={result.data as Record<string, any>[]}
                title={result.title}
                insight={result.insight}
                preferredChart={result.preferredChart}
                isHeatmap={toolInvocation.toolName === "getPageHeatmap"}
                analysis={result.analysis}
                isSessionList={toolInvocation.toolName === "getSessionList"}
              />
            );
          }
          return (
            <div
              key={toolInvocation.toolCallId}
              className="text-xs md:text-sm text-muted-foreground"
            >
              Loading visualization...
            </div>
          );
        })}
      </div>
    </Card>
  );
}
