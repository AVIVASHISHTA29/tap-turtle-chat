import { Button } from "@/components/ui/button";
import { EXAMPLE_QUERIES } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface WelcomeSectionProps {
  onExampleClick: (query: string) => void;
}

export function WelcomeSection({ onExampleClick }: WelcomeSectionProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-32 text-center ">
      <div className="flex justify-center items-center rounded-full p-4 my-4">
        <p className="text-6xl">🐢</p>
      </div>
      <h3 className="text-2xl font-semibold mb-4">Tap Turtle AI Analytics</h3>
      <p className="text-md text-muted-foreground mb-4">
        Ask questions about your analytics or try one of these examples:
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {EXAMPLE_QUERIES.map((example: { label: string; query: string }) => (
          <Button
            key={example.label}
            variant="outline"
            size="sm"
            onClick={() => onExampleClick(example.query)}
            className="text-sm"
          >
            {example.label}
          </Button>
        ))}
      </div>
      <h3 className="text-2xl font-semibold mt-6 mb-4">Or</h3>
      <p className="text-md text-muted-foreground mb-4">
        Look At Session Recordings & Analysis
      </p>
      <Button
        variant="outline"
        size="sm"
        className="text-sm"
        onClick={() => router.push("/recordings")}
      >
        View Session Analytics
      </Button>
    </div>
  );
}
