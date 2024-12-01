"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { AnalyticsVisualization } from "./analytics-visualization";

interface AnalyticsMessageProps {
  message: Message;
}

export function AnalyticsMessage({ message }: AnalyticsMessageProps) {
  return (
    <Card
      className={cn(
        "mb-4 p-4",
        message.role === "assistant" ? "bg-muted" : "bg-primary/5"
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="font-medium">
          {message.role === "assistant" ? "AI Assistant" : "You"}
        </div>
        <div className="text-sm">{message.content}</div>

        {message.toolInvocations?.map((toolInvocation) => {
          if (toolInvocation.state === "result") {
            const result = toolInvocation.result as {
              title: string;
              insight: string;
              type: string;
              data: unknown;
            };

            return (
              <AnalyticsVisualization
                key={toolInvocation.toolCallId}
                type={toolInvocation.toolName}
                data={result.data}
                title={result.title}
                insight={result.insight}
              />
            );
          }
          return (
            <div
              key={toolInvocation.toolCallId}
              className="text-sm text-muted-foreground"
            >
              Loading visualization...
            </div>
          );
        })}
      </div>
    </Card>
  );
}
