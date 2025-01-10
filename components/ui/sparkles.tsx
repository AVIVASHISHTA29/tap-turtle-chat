"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface SparklesCoreProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  className?: string;
}

export const SparklesCore = ({
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 100,
  particleColor = "#FFF",
  className,
  ...props
}: SparklesCoreProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<
    Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
    }>
  >([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    });

    resizeObserver.observe(canvas);

    const initParticles = () => {
      particles.current = [];
      const numParticles =
        Math.floor((canvas.width * canvas.height) / 10000) * particleDensity;
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (maxSize - minSize) + minSize,
          speedX: Math.random() * 0.2 - 0.1,
          speedY: Math.random() * 0.2 - 0.1,
        });
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxSize, minSize, particleColor, particleDensity]);

  return (
    <div className={cn("h-full w-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        style={{
          background,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};
