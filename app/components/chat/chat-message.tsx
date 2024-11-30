import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { BotIcon, UserIcon } from "lucide-react";

import { AnalyticsVisualization } from "./analytics-visualization";
import { ChatToolInvocations } from "./chat-tool-invocations";

interface ChatMessageProps {
  message: Message;
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

export function ChatMessage({ message, addToolResult }: ChatMessageProps) {
  // Try to parse the content as JSON to check for visualization data
  let visualizationData = null;
  let textContent = message.content;

  try {
    const parsed = JSON.parse(message.content);
    if (parsed.type && parsed.data) {
      visualizationData = parsed;
      textContent = ""; // Clear text content if we have visualization data
    }
  } catch (e) {
    console.log(e);
    // Not JSON, treat as regular message
  }

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 p-4",
        message.role === "assistant" ? "bg-muted/40" : "bg-background"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow">
        {message.role === "assistant" ? (
          <BotIcon className="h-4 w-4" />
        ) : (
          <UserIcon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        {textContent && (
          <Card className="max-w-[90%]">
            <CardContent className="p-3">
              <p className="text-sm">{textContent}</p>
            </CardContent>
          </Card>
        )}
        {visualizationData && (
          <AnalyticsVisualization
            data={visualizationData.data}
            type={visualizationData.type}
            title={visualizationData.title}
            description={visualizationData.description}
          />
        )}
        {message.toolInvocations && (
          <ChatToolInvocations
            toolInvocations={message.toolInvocations}
            addToolResult={addToolResult}
          />
        )}
      </div>
    </div>
  );
}
