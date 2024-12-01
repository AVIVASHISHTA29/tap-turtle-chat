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

  // Helper function to get color based on intensity
  const getIntensityColor = (value: number) => {
    // Define color stops
    const colors = [
      { stop: 0.2, color: [0, 255, 0] }, // Green for low intensity
      { stop: 0.4, color: [255, 255, 0] }, // Yellow for medium-low
      { stop: 0.6, color: [255, 165, 0] }, // Orange for medium
      { stop: 0.8, color: [255, 69, 0] }, // Red-Orange for medium-high
      { stop: 1.0, color: [255, 0, 0] }, // Red for high intensity
    ];

    // Find appropriate color range
    let startColor, endColor, startStop, endStop;
    for (let i = 0; i < colors.length; i++) {
      if (value <= colors[i].stop) {
        if (i === 0) {
          return `rgba(${colors[0].color.join(",")}, ${value * 0.8})`;
        }
        startColor = colors[i - 1].color;
        endColor = colors[i].color;
        startStop = colors[i - 1].stop;
        endStop = colors[i].stop;
        break;
      }
    }

    if (!startColor || !endColor) {
      return `rgba(255, 0, 0, ${value * 0.8})`;
    }

    if (startStop === undefined || endStop === undefined) {
      return `rgba(255, 0, 0, ${value * 0.8})`;
    }

    // Interpolate between colors
    const ratio = (value - startStop) / (endStop - startStop);
    const r = Math.floor(startColor[0] + (endColor[0] - startColor[0]) * ratio);
    const g = Math.floor(startColor[1] + (endColor[1] - startColor[1]) * ratio);
    const b = Math.floor(startColor[2] + (endColor[2] - startColor[2]) * ratio);

    return `rgba(${r}, ${g}, ${b}, ${value * 0.8})`;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src =
      "https://static.wixstatic.com/media/72c0b2_b3cae0ab282b4c80b826d6cd1870192f~mv2.jpg/v1/fill/w_924,h_437,al_c,q_85,enc_auto/72c0b2_b3cae0ab282b4c80b826d6cd1870192f~mv2.jpg";

    img.onload = () => {
      // Calculate scaling factors
      const scaleX = width / img.width;
      const scaleY = height / img.height;
      const scale = Math.min(scaleX, scaleY);

      // Calculate centered position
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;

      // Clear and fill background
      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, width, height);

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Create offscreen canvas for heatmap
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      // Draw heatmap points
      data.forEach((point) => {
        // Scale coordinates to match image
        const scaledX = (point.x / 100) * drawWidth + offsetX;
        const scaledY = (point.y / 100) * drawHeight + offsetY;

        const radius = Math.max(drawWidth, drawHeight) * 0.1; // Relative radius
        const gradient = offCtx.createRadialGradient(
          scaledX,
          scaledY,
          0,
          scaledX,
          scaledY,
          radius
        );

        const color = getIntensityColor(point.value);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace("0.8)", "0.4)"));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        offCtx.fillStyle = gradient;
        offCtx.beginPath();
        offCtx.arc(scaledX, scaledY, radius, 0, Math.PI * 2);
        offCtx.fill();
      });

      // Overlay heatmap with blend mode
      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(offscreen, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      // Add subtle overlay for better visibility
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
