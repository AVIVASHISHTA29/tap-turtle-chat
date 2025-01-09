"use client";

import { ChevronsUpDown, Command } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Project, useGetProjectsQuery } from "@/redux/features/projects/api";
import { setSelectedProject } from "@/redux/features/projects/slice";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// This is sample data.

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );

  const { data } = useGetProjectsQuery();

  const projects = data || [];

  const dispatch = useDispatch();

  const handleActiveProject = (project: Project) => {
    dispatch(setSelectedProject(project));
  };

  useEffect(() => {
    if (projects.length > 0) {
      dispatch(setSelectedProject(projects[0]));
    }
  }, [projects]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedProject?.project_name || "Select Project"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projects
            </DropdownMenuLabel>
            {projects.map((project, index) => {
              return (
                <DropdownMenuItem
                  key={index}
                  className="gap-2 p-2"
                  onClick={() => handleActiveProject(project)}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Command className="size-4" />
                  </div>
                  <span>{project.project_name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
