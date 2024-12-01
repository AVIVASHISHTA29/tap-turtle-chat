"use client";

import * as d3 from "d3";
import { GeoPermissibleObjects } from "d3-geo";
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

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src =
      "https://i.ibb.co/R3V4Whb/Screenshot-2024-12-01-at-12-46-59-PM.png";

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

      // Create density data
      const densityData = d3
        .contourDensity<HeatmapPoint>()
        .x((d) => (d.x / 100) * drawWidth + offsetX)
        .y((d) => (d.y / 100) * drawHeight + offsetY)
        .weight((d) => d.value)
        .size([width, height])
        .bandwidth(30)
        .thresholds(30)(data);

      // Updated color scale to use orange-to-red gradient
      const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(
        d3.interpolateRgb.gamma(0.8)(
          "rgba(255, 165, 0, 0.2)", // Light orange with low opacity
          "rgba(255, 0, 0, 0.8)" // Bright red with high opacity
        )
      );

      // Create offscreen canvas for heatmap
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      // Draw density contours
      const geoPath = d3.geoPath().context(offCtx);

      densityData.forEach((density) => {
        offCtx.beginPath();
        geoPath(density as GeoPermissibleObjects);
        offCtx.fillStyle = colorScale(density.value);
        offCtx.fill();
      });

      // Increased blur for smoother appearance
      offCtx.filter = "blur(15px)";
      offCtx.drawImage(offscreen, 0, 0);
      offCtx.filter = "none";

      // Changed blend mode for better color visibility
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(offscreen, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      // Adjusted overlay for better contrast
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
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
