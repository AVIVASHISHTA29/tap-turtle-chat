"use client";

import { useEffect, useRef } from "react";

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

interface HeatmapVisualizationProps {
  data: HeatmapPoint[];
  width?: number;
  height?: number;
}

export function HeatmapVisualization({
  data,
  width = 800,
  height = 600,
}: HeatmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw base screenshot
    const img = new Image();
    img.src =
      "https://static.wixstatic.com/media/72c0b2_b3cae0ab282b4c80b826d6cd1870192f~mv2.jpg/v1/fill/w_924,h_437,al_c,q_85,enc_auto/72c0b2_b3cae0ab282b4c80b826d6cd1870192f~mv2.jpg";
    img.onload = () => {
      // Draw the image maintaining aspect ratio
      const imgAspectRatio = img.width / img.height;
      const canvasAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasAspectRatio > imgAspectRatio) {
        drawWidth = height * imgAspectRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgAspectRatio;
        offsetY = (height - drawHeight) / 2;
      }

      // First draw with background color
      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, width, height);

      // Draw the image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Create composite operation for better blending
      ctx.globalCompositeOperation = "screen";

      // Draw heatmap overlay
      data.forEach((point) => {
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          80
        );

        // Use a more sophisticated color gradient
        gradient.addColorStop(0, `rgba(255, 0, 0, ${point.value * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${point.value * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 200, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 80, 0, Math.PI * 2);
        ctx.fill();
      });

      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";

      // Add a subtle overlay to enhance visibility
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);
    };
  }, [data, width, height]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
