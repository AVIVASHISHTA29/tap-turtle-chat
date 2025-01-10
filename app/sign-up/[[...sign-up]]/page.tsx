import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { SparklesCore } from "@/components/ui/sparkles";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const words = "Join TapTurtle Today";

  return (
    <div className="h-screen w-full bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <div className="absolute inset-0 h-screen w-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <Link href="/" className="absolute left-8 top-8">
        <Button variant="ghost" size="icon" className="text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-full max-w-md px-4 space-y-6">
          <div className="h-20 w-full flex flex-col items-center justify-center overflow-hidden rounded-xl">
            <h1 className="md:text-4xl text-xl text-center font-bold text-white relative z-20">
              <TextGenerateEffect words={words} />
            </h1>
            <div className="w-full h-full">
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={100}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <SignUp />
            </div>
            <BackgroundBeams className="absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
