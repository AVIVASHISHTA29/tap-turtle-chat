"use client";

import { StartChat } from "@/components/app/chat/start-chat";
import { Card } from "@/components/ui/card";
import { useCreateConversationMutation } from "@/redux/features/chat/api";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function Page() {
  const [createConversation, { isLoading: isCreatingConversation }] =
    useCreateConversationMutation();
  const router = useRouter();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const handleNewChat = async () => {
    try {
      const result = await createConversation({
        title: "New Chat",
        projectId: selectedProject.project_id,
      }).unwrap();
      router.push(`/chat/${result.conversation_id}`);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  return (
    <div className="p-0 w-full h-full flex flex-col items-center justify-center">
      <Card className="mt-[-100px] flex flex-col p-0 rounded-none border-0">
        <StartChat
          startChat={handleNewChat}
          isLoading={isCreatingConversation}
        />
      </Card>
    </div>
  );
}
