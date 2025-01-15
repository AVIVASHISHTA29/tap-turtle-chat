"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAddMessageMutation,
  useGetConversationQuery,
} from "@/redux/features/chat/api";
import { setLoading } from "@/redux/features/chat/slice";
import { RootState } from "@/redux/store";
import { Message, useChat } from "ai/react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnalyticsMessage } from "../charts/analytics-message";
import { ChatInput } from "./chat-input";
import { LoadingMessage } from "./loading-message";
import { WelcomeSection } from "./welcome-section";

export function ChatInterface() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const dispatch = useDispatch();
  const { data: currentConversation, isLoading: isLoadingConversation } =
    useGetConversationQuery({
      conversationId,
      projectId: selectedProject?.project_id ?? "",
    });

  const [addMessage] = useAddMessageMutation();

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
    onFinish: async (message) => {
      // Save the complete message to the database
      console.log(message);
      await addMessage({
        conversation_id: conversationId,
        content: message.content,
        role: message.role,
        tool_invocations: message.toolInvocations || [],
      });
    },
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

  useEffect(() => {
    if (isLoadingConversation) {
      dispatch(setLoading(true));
    } else {
      dispatch(setLoading(false));
    }
  }, [isLoadingConversation]);

  if (isLoadingConversation) {
    return (
      <Card className="h-full flex-1 flex flex-col max-h-screen p-0 rounded-none border-0">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex-1 flex flex-col max-h-screen p-0 rounded-none border-0">
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
  );
}
