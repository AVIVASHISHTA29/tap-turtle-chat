import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXAMPLE_QUERIES } from "@/lib/constants";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  showSuggestions: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExampleClick: (query: string) => void;
}

export function ChatInput({
  input,
  isLoading,
  showSuggestions,
  onInputChange,
  onSubmit,
  onExampleClick,
}: ChatInputProps) {
  return (
    <div className="p-2 md:p-4 border-t">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask about your analytics..."
          className="flex-1 text-sm md:text-base"
        />
        <Button type="submit" disabled={isLoading} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {showSuggestions && (
        <div className="mt-2 flex flex-wrap gap-1 md:gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <Button
              key={example.label}
              variant="outline"
              size="sm"
              onClick={() => onExampleClick(example.query)}
              className="text-xs"
            >
              {example.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
