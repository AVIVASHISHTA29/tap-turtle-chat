import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChatConversation,
  useCreateConversationMutation,
} from "@/redux/features/chat/api";
import { RootState } from "@/redux/store";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Loader2, PanelRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ChatSidebarItem } from "./chat-sidebar-item";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  setOpenSidebar: (open: boolean) => void;
  openSidebar: boolean;
}

export function ChatSidebar({
  conversations,
  setOpenSidebar,
  openSidebar,
}: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const [createConversation, { isLoading: isCreatingConversation }] =
    useCreateConversationMutation();

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
    <>
      <div
        className={cn(
          "border-r border-border bg-card flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          openSidebar ? "w-64 translate-x-0" : "w-14 translate-x-0"
        )}
      >
        <div
          className={`${
            openSidebar ? "p-4 min-w-64 gap-2" : "p-0"
          } flex items-center justify-between w-full`}
        >
          {openSidebar ? (
            <>
              <Button
                onClick={handleNewChat}
                className="w-full"
                variant="outline"
                disabled={isCreatingConversation}
              >
                {isCreatingConversation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusIcon className="h-4 w-4 mr-2" />
                )}
                New Chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenSidebar(false)}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full mt-2"
              onClick={() => setOpenSidebar(true)}
            >
              <PanelRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {openSidebar && (
          <ScrollArea className="flex-1 min-w-64">
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
        )}
      </div>
    </>
  );
}
