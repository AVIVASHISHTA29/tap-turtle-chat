/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import h337 from "heatmap.js";
import { useEffect, useRef } from "react";

const HeatmapOverlay = ({
  data,
  width,
  height,
}: {
  data: any;
  width: any;
  height: any;
}) => {
  const heatmapContainerRef = useRef(null);

  useEffect(() => {
    if (!heatmapContainerRef.current) return;

    // Initialize the heatmap instance
    const heatmapInstance = h337.create({
      container: heatmapContainerRef.current,
      radius: 20,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.9,
    });

    // Format data for the heatmap
    const heatmapData = {
      max: Math.max(...data.map((d: any) => d.intensity)),
      data: data.map((d: any) => ({
        x: d.x,
        y: d.y,
        value: d.intensity,
      })),
    };

    // Set the heatmap data
    heatmapInstance.setData(heatmapData as any);

    return () => {
      heatmapInstance.setData({ max: 0, data: [] } as any); // Clean up
    };
  }, [data]);

  return (
    <div
      ref={heatmapContainerRef}
      className="absolute top-[calc(-100vh+100px)] left-0 pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 9999,
      }}
    />
  );
};

export default HeatmapOverlay;
