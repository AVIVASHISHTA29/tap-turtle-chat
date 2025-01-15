/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import HeatmapOverlay from "@/components/app/heatmap/heatmap-overlay";
import { useGetHeatmapDataQuery } from "@/redux/features/heatmap/api";
import { RootState } from "@/redux/store";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const App = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const { data: heatmapData, isLoading } = useGetHeatmapDataQuery(
    { projectId: selectedProject?.project_id },
    { skip: !selectedProject?.project_id }
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (iframeRef) {
        const rect = iframeRef.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [iframeRef]);

  if (!selectedProject?.project_id) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please select a project first.</p>
      </div>
    );
  }

  if (!selectedProject?.project_url) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please set a project URL in project settings first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="animate-spin h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-100px)] p-0 overflow-hidden">
      <iframe
        ref={setIframeRef}
        src={selectedProject.project_url}
        title="Website"
        className="w-full h-full border-none"
      />
      {dimensions.width > 0 && dimensions.height > 0 && heatmapData && (
        <HeatmapOverlay
          data={heatmapData}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}
    </div>
  );
};

export default App;
