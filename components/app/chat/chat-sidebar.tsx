import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatConversation,
  useCreateConversationMutation,
} from "@/redux/features/chat/api";
import { RootState } from "@/redux/store";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ChatSidebarItem } from "./chat-sidebar-item";

interface ChatSidebarProps {
  conversations: ChatConversation[];
}

export function ChatSidebar({ conversations }: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [createConversation] = useCreateConversationMutation();

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
    <div
      className={"max-w-64 w-full border-r border-border bg-card flex flex-col"}
    >
      <div className="p-4">
        <Button onClick={handleNewChat} className="w-full" variant="outline">
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {conversations.map((conversation) => (
            <ChatSidebarItem
              key={conversation.conversation_id}
              conversation={conversation}
              isActive={conversation.conversation_id === conversationId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
