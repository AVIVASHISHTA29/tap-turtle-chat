"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Project,
  useCreateProjectMutation,
  useGetProjectsQuery,
} from "@/lib/store/api";
import { useState } from "react";

export default function ProjectsPage() {
  const [newProjectName, setNewProjectName] = useState("");
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject({ project_name: newProjectName.trim() }).unwrap();
      setNewProjectName("");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Your Projects</h1>
        <form onSubmit={handleCreateProject} className="flex gap-4">
          <Input
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <Button type="submit">Create Project</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project: Project) => (
          <Card key={project.project_id}>
            <CardHeader>
              <CardTitle>{project.project_name}</CardTitle>
              <CardDescription>
                Created on {new Date(project.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>API Key: {project.api_key}</p>
                <p>Project ID: {project.project_id}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
