"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { SendIcon } from "lucide-react";
import { ChatMessage } from "./components/chat/chat-message";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, addToolResult } =
    useChat({
      api: "/api/chat",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your analytics assistant. I can help you analyze your website's event data. 
            Try asking me things like:
            - "Show me clicks from the last 24 hours"
            - "How many scroll events occurred in the past week?"
            - "Display hourly mousemove events for today"
            
            First, please provide your API key to get started.`,
        },
      ],
    });

  return (
    <div className="flex flex-col h-[100vh] max-w-3xl mx-auto">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((m) => (
            <ChatMessage key={m.id} message={m} addToolResult={addToolResult} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your analytics data..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
