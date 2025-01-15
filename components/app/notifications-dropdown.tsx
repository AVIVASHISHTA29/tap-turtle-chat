import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  useGetUserInvitationsQuery,
  useRespondToInvitationMutation,
} from "@/redux/features/projects/api";
import { format } from "date-fns";
import { Bell, Loader2 } from "lucide-react";

interface NotificationsDropdownProps {
  isExpanded: boolean;
}

export function NotificationsDropdown({
  isExpanded,
}: NotificationsDropdownProps) {
  const { data: invitations, isLoading } = useGetUserInvitationsQuery();
  const [respondToInvitation] = useRespondToInvitationMutation();
  const { toast } = useToast();

  const handleInvitationResponse = async (
    invitationId: string,
    action: "accept" | "reject"
  ) => {
    try {
      await respondToInvitation({ invitationId, action }).unwrap();
      toast({
        title: `Invitation ${action}ed`,
        description: `You have successfully ${action}ed the invitation.`,
      });
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} invitation. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative gap-2 hover:bg-muted/50",
            isExpanded ? "px-3 py-2" : "px-2 py-1.5"
          )}
        >
          <Bell
            className={cn(
              "transition-all duration-300",
              isExpanded ? "h-4 w-4" : "h-3.5 w-3.5"
            )}
          />
          {invitations && invitations.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {invitations.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Project Invitations</DropdownMenuLabel>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            invitations.map((invitation) => (
              <div
                key={invitation.invitation_id}
                className="flex flex-col gap-2 border-t p-4"
              >
                <div>
                  <p className="font-medium">{invitation.project_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited {format(new Date(invitation.created_at), "PPp")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleInvitationResponse(
                        invitation.invitation_id,
                        "accept"
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleInvitationResponse(
                        invitation.invitation_id,
                        "reject"
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No pending invitations
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
