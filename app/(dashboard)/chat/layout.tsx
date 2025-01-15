"use client";

import { ChatSidebar } from "@/components/app/chat/chat-sidebar";
import { useGetConversationsQuery } from "@/redux/features/chat/api";
import { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";

function ChatLayout({ children }: { children: React.ReactNode }) {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const { data: conversations, isLoading } = useGetConversationsQuery({
    projectId: selectedProject?.project_id ?? "",
  });
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
