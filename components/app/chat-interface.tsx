"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import { AnalyticsMessage } from "./analytics-message";
import { ChatInput } from "./chat-input";
import { LoadingMessage } from "./loading-message";
import { WelcomeSection } from "./welcome-section";

export function ChatInterface() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const pendingSubmission = useRef<string | null>(null);

  useEffect(() => {
    if (pendingSubmission.current === input) {
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      handleSubmit(submitEvent as unknown as React.FormEvent);
      pendingSubmission.current = null;
    }
  }, [input, handleSubmit]);

  const handleExampleClick = (query: string) => {
    pendingSubmission.current = query;
    setInput(query);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-120px)] md:h-screen flex flex-col md:max-h-[calc(100vh-10rem)]">
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-2 md:p-4">
          {messages.length === 0 && (
            <WelcomeSection onExampleClick={handleExampleClick} />
          )}
          {messages.map((message) => (
            <AnalyticsMessage key={message.id} message={message} />
          ))}
          {isLoading && <LoadingMessage />}
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
