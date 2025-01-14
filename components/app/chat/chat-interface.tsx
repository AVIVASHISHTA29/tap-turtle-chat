"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetConversationQuery,
  useGetConversationsQuery,
} from "@/redux/features/chat/api";
import { Message, useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnalyticsMessage } from "../charts/analytics-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { LoadingMessage } from "./loading-message";
import { WelcomeSection } from "./welcome-section";

export function ChatInterface() {
  const params = useParams();
  const conversationId = params?.conversationId as string;

  const { data: conversations } = useGetConversationsQuery();
  const { data: currentConversation } = useGetConversationQuery(
    conversationId,
    {
      skip: !conversationId,
    }
  );

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      conversationId,
    },
    id: conversationId,
    initialMessages: currentConversation?.messages as unknown as Message[],
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

  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages as unknown as Message[]);
    }
  }, [currentConversation?.messages, setMessages]);

  const handleExampleClick = (query: string) => {
    pendingSubmission.current = query;
    setInput(query);
  };

  const handleClearChat = () => {
    setMessages([]);
    reload();
  };

  return (
    <div className="flex h-full w-full">
      <ChatSidebar conversations={conversations || []} />
      <Card className="flex-1 flex flex-col max-h-screen p-0 rounded-none border-0">
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
            handleClearChat={handleClearChat}
          />
        </div>
      </Card>
    </div>
  );
}
