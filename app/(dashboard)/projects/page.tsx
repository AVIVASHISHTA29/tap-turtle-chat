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
} from "@/redux/features/projects/api";
import { Globe, Loader2, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectsPage() {
  const router = useRouter();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject({
        project_name: newProjectName.trim(),
        project_url: newProjectUrl.trim(),
      }).unwrap();
      setNewProjectName("");
      setNewProjectUrl("");
      setIsFormVisible(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Manage your tracking projects and view their analytics
            </p>
          </div>
          <Button
            onClick={() => setIsFormVisible(true)}
            disabled={isFormVisible}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {isFormVisible && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Add a new project to start tracking user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label
                      htmlFor="project-name"
                      className="text-sm font-medium"
                    >
                      Project Name
                    </label>
                    <Input
                      id="project-name"
                      placeholder="My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="project-url"
                      className="text-sm font-medium"
                    >
                      Project URL (optional)
                    </label>
                    <Input
                      id="project-url"
                      placeholder="https://example.com"
                      value={newProjectUrl}
                      onChange={(e) => setNewProjectUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsFormVisible(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project: Project) => (
          <Card
            key={project.project_id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2"
            onClick={() => handleProjectClick(project.project_id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{project.project_name}</span>
                <Settings className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {project.project_url ? (
                  <span className="truncate">{project.project_url}</span>
                ) : (
                  "No URL set"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">API Key</p>
                    <p className="text-sm font-medium truncate">
                      {project.api_key.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Click to view details and analytics
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects?.length === 0 && !isFormVisible && (
          <Card
            className="col-span-full cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsFormVisible(true)}
          >
            <CardHeader className="items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Create Your First Project</CardTitle>
              <CardDescription>
                Get started by creating a new tracking project
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
