import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChatConversation,
  useDeleteConversationMutation,
  useUpdateConversationMutation,
} from "@/redux/features/chat/api";
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ChatSidebarItemProps {
  conversation: ChatConversation;
  isActive: boolean;
}

export function ChatSidebarItem({
  conversation,
  isActive,
}: ChatSidebarItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [updateConversation, { isLoading: isUpdatingConversation }] =
    useUpdateConversationMutation();
  const [deleteConversation, { isLoading: isDeletingConversation }] =
    useDeleteConversationMutation();

  const handleClick = () => {
    router.push(`/chat/${conversation.conversation_id}`);
  };

  const handleEdit = async () => {
    if (isEditing) {
      try {
        await updateConversation({
          conversationId: conversation.conversation_id,
          title,
        }).unwrap();
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update conversation:", error);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConversation(conversation.conversation_id).unwrap();
      router.push("/chat");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  return (
    <div
      className={`w-full group rounded-lg p-2 hover:bg-accent transition-colors border ${
        isActive ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <ChatBubbleLeftIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEdit();
                }
              }}
              onBlur={() => {
                handleEdit();
              }}
              className="h-6 text-xs"
              autoFocus
            />
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-6 text-xs font-normal"
              onClick={handleClick}
            >
              <span className="truncate">{conversation.title}</span>
            </Button>
          )}
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.updated_at), {
              addSuffix: true,
            })}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleEdit}
            disabled={isUpdatingConversation}
          >
            {isUpdatingConversation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PencilIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDelete}
            disabled={isDeletingConversation}
          >
            {isDeletingConversation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
