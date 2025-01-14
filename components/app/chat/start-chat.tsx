import { Button } from "@/components/ui/button";
import { BotIcon, Loader2 } from "lucide-react";

interface StartChatProps {
  startChat: () => void;
  isLoading: boolean;
}

export function StartChat({ startChat, isLoading }: StartChatProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-32 text-center ">
      <div className="flex justify-center items-center rounded-full p-4 my-4">
        <p className="text-6xl">🐢</p>
      </div>
      <h3 className="text-2xl font-semibold mb-4">Tap Turtle AI Analytics</h3>
      <p className="text-md text-muted-foreground mb-4">
        Ask questions about any analytics that you want in real time!
      </p>
      <Button
        variant="outline"
        size="sm"
        className="text-sm"
        onClick={startChat}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <BotIcon className="w-4 h-4" />
        )}
        Start Chat
      </Button>
    </div>
  );
}
