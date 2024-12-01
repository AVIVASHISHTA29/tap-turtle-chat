"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { AnalyticsMessage } from "./analytics-message";
import { ChatInput } from "./chat-input";
import { WelcomeSection } from "./welcome-section";

export function ChatInterface() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const handleExampleClick = (query: string) => {
    setInput(query);
    const form = document.createElement("form");
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });

    form.dispatchEvent(submitEvent);
    handleSubmit(submitEvent as unknown as React.FormEvent);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-screen flex flex-col max-h-[calc(100vh-10rem)]">
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <WelcomeSection onExampleClick={handleExampleClick} />
          )}
          {messages.map((message) => (
            <AnalyticsMessage key={message.id} message={message} />
          ))}
        </ScrollArea>

        <ChatInput
          input={input}
          isLoading={isLoading}
          showSuggestions={messages.length > 0}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onExampleClick={handleExampleClick}
        />
      </div>
    </Card>
  );
}
