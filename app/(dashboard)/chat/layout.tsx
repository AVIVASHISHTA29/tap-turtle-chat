"use client";

import { ChatSidebar } from "@/components/app/chat/chat-sidebar";
import { useGetConversationsQuery } from "@/redux/features/chat/api";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

function ChatLayout({ children }: { children: React.ReactNode }) {
  const { data: conversations, isLoading } = useGetConversationsQuery();
  const [openSidebar, setOpenSidebar] = useState<boolean>(true);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  return (
    <div className="flex h-full w-full">
      <ChatSidebar
        conversations={conversations || []}
        setOpenSidebar={setOpenSidebar}
        openSidebar={openSidebar}
      />

      <div className="flex-1 h-full w-full">{children}</div>
    </div>
  );
}

export default ChatLayout;
