import { ChatInterface } from "@/components/app/chat-interface";

export default function Page() {
  return (
    <div className="p-4 w-full min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-center">
        Tap Turtle AI Analytics
      </h1>
      <ChatInterface />
    </div>
  );
}
