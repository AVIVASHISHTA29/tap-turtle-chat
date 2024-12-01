"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { Send } from "lucide-react";
import { AnalyticsMessage } from "./analytics-message";

export function ChatInterface() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <Card className="w-full max-w-4xl mx-auto h-screen flex flex-col max-h-[calc(100vh-10rem)]">
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4">
          {messages.map((message) => (
            <AnalyticsMessage key={message.id} message={message} />
          ))}
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your analytics data..."
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
