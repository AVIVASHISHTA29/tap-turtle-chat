import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoadingMessage() {
  return (
    <Card className="mb-4 p-4 bg-muted">
      <div className="flex items-center gap-3">
        <div className="font-medium">AI Assistant</div>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    </Card>
  );
}
