import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolInvocation } from "ai";
import { WrenchIcon } from "lucide-react";

interface ChatToolInvocationsProps {
  toolInvocations: ToolInvocation[];
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

export function ChatToolInvocations({
  toolInvocations,
  addToolResult,
}: ChatToolInvocationsProps) {
  return (
    <div className="space-y-2">
      {toolInvocations.map((toolInvocation) => {
        const toolCallId = toolInvocation.toolCallId;

        if (toolInvocation.toolName === "askForConfirmation") {
          return (
            <Card key={toolCallId} className="max-w-[90%]">
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <WrenchIcon className="h-4 w-4" />
                  Confirmation Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-sm mb-3">{toolInvocation.args.message}</p>
                {"result" in toolInvocation ? (
                  <p className="font-medium">{toolInvocation.result}</p>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        addToolResult({ toolCallId, result: "Yes" })
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addToolResult({ toolCallId, result: "No" })
                      }
                    >
                      No
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={toolCallId} className="max-w-[90%]">
            <CardContent className="p-3">
              {"result" in toolInvocation ? (
                <div className="flex items-center gap-2 text-sm">
                  <WrenchIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {toolInvocation.toolName}:
                  </span>
                  {toolInvocation.result}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <WrenchIcon className="h-4 w-4" />
                  <span>Calling {toolInvocation.toolName}...</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
