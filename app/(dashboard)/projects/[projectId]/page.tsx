"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "@/redux/features/projects/api";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const project = projects?.find((p) => p.project_id === projectId);

  const [editMode, setEditMode] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  // Initialize edit form when project data is loaded
  useEffect(() => {
    if (project) {
      setProjectName(project.project_name);
      setProjectUrl(project.project_url || "");
    }
  }, [project]);

  const handleSave = async () => {
    try {
      await updateProject({
        projectId,
        data: {
          project_name: projectName.trim(),
          project_url: projectUrl.trim(),
        },
      }).unwrap();
      setEditMode(false);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      router.push("/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const installCommand = `npm install @tap-turtle/react`;
  const initCode = `import { TapTurtleProvider } from '@tap-turtle/react';

function App() {
  return (
    <TapTurtleProvider apiKey="${project.api_key}">
      {/* Your app content */}
    </TapTurtleProvider>
  );
}`;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {editMode ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-3xl font-bold h-auto text-lg"
            />
          ) : (
            project.project_name
          )}
        </h1>
        <div className="flex gap-4">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Edit Project
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Project</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your project and all associated data including recordings,
                      events, and analytics.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Project"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Project ID:</strong> {project.project_id}
              </div>
              <div>
                <strong>API Key:</strong> {project.api_key}
              </div>
              <div>
                <strong>Project URL:</strong>{" "}
                {editMode ? (
                  <Input
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="Enter project URL"
                    className="mt-1"
                  />
                ) : (
                  project.project_url || "Not set"
                )}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="react">
              <TabsList>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>

              <TabsContent value="react" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    1. Install the package
                  </h3>
                  <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
                    <code>{installCommand}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    2. Initialize in your app
                  </h3>
                  <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
                    <code>{initCode}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    3. That&apos;s it!
                  </h3>
                  <p>
                    Your app is now being tracked. View recordings and analytics
                    in your dashboard.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
