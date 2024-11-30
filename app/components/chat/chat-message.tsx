import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { BotIcon, UserIcon } from "lucide-react";
import { ChatToolInvocations } from "./chat-tool-invocations";

interface ChatMessageProps {
  message: Message;
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

export function ChatMessage({ message, addToolResult }: ChatMessageProps) {
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
        <Card className="max-w-[90%]">
          <CardContent className="p-3">
            <p className="text-sm">{message.content}</p>
          </CardContent>
        </Card>
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
