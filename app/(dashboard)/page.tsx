"use client";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

export default function Page() {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  if (!selectedProject) {
    return <div>No project selected</div>;
  }

  return (
    <div className="p-0 w-full h-screen flex flex-col items-center justify-center">
      <h1>Welcome to Tap Turtle Analytics</h1>
      <p>Project: {selectedProject.project_name}</p>
    </div>
  );
}
