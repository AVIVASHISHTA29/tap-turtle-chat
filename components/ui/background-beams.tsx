"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const beamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!beamsRef.current) return;

    const beams = beamsRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = beams.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      beams.style.setProperty("--mouse-x", `${mouseX}px`);
      beams.style.setProperty("--mouse-y", `${mouseY}px`);
    };

    beams.addEventListener("mousemove", handleMouseMove);
    return () => {
      beams.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={beamsRef}
      className={cn(
        "absolute inset-0 overflow-hidden [--mouse-x:50%] [--mouse-y:50%]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/30 via-transparent to-transparent [transform:translate(var(--mouse-x),var(--mouse-y))] opacity-0 transition-opacity duration-500 hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent [transform:translate(var(--mouse-x),var(--mouse-y))] opacity-0 transition-opacity duration-500 hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/30 via-transparent to-transparent [transform:translate(var(--mouse-x),var(--mouse-y))] opacity-0 transition-opacity duration-500 hover:opacity-100" />
    </div>
  );
};
