import { ChatInterface } from "@/components/app/chat-interface";

export default function Page() {
  return (
    <div className="py-10 w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Tap Turtle AI Analytics
      </h1>
      <ChatInterface />
    </div>
  );
}
