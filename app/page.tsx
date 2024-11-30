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
      maxSteps: 5,
      api: "/api/chat",
      async onToolCall({ toolCall }) {
        if (toolCall.toolName === "getLocation") {
          const cities = [
            "New York",
            "Los Angeles",
            "Chicago",
            "San Francisco",
          ];
          return cities[Math.floor(Math.random() * cities.length)];
        }
      },
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
            placeholder="Type a message..."
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
