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
import { useToast } from "@/components/ui/use-toast";

import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "@/redux/features/projects/api";
import { setSelectedProject } from "@/redux/features/projects/slice";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function ProjectDetailsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const projectId = params.projectId as string;
  const { data: projects, isLoading } = useGetProjectsQuery();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const project = projects?.find((p) => p.project_id === projectId);

  const [editMode, setEditMode] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

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
      toast({
        title: "Project updated",
        description: "Your project details have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your project.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      router.push("/projects");
      toast({
        title: "Project deleted",
        description: "Your project and all its data have been deleted.",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your project.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description,
    });
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
  const initCode = `import React, { useEffect } from 'react';
import { initializeObservability } from '@tap-turtle/react';

function App() {

  useEffect(() => {
    initializeObservability({
      apiKey: "${project.api_key}",
    });
  }, []);

  return (
    <Component/>
  );
}`;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            {editMode ? (
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-4xl font-bold h-auto text-lg max-w-md"
              />
            ) : (
              <h1 className="text-4xl font-bold tracking-tight">
                {project.project_name}
              </h1>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              {editMode ? (
                <Input
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="Enter project URL"
                  className="h-8"
                />
              ) : (
                <span>{project.project_url || "No URL set"}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
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
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your project and all associated data including
                        recordings, events, and analytics.
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
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-muted font-mono text-sm">
                      {project.project_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(
                          project.project_id,
                          "Project ID copied to clipboard"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-muted font-mono text-sm">
                      {project.api_key}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(
                          project.api_key,
                          "API key copied to clipboard"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Created on{" "}
                    {new Date(project.created_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="react" className="space-y-6">
              <TabsList>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>

              <TabsContent value="react" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      1. Install the package
                    </h3>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{installCommand}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3"
                        onClick={() =>
                          copyToClipboard(
                            installCommand,
                            "Install command copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      2. Initialize in your app
                    </h3>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{initCode}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3"
                        onClick={() =>
                          copyToClipboard(
                            initCode,
                            "Initialization code copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3. That&apos;s it!
                    </h3>
                    <p className="text-muted-foreground">
                      Your app is now being tracked. View recordings and
                      analytics in your dashboard.{" "}
                    </p>
                    <Button
                      onClick={() => {
                        dispatch(setSelectedProject(project));
                        router.push(
                          `/recordings?project=${project.project_id}`
                        );
                      }}
                    >
                      Go to recordings
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
