"use client";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useGetProjectsQuery } from "@/redux/features/projects/api";
import { setLoading, setProjects } from "@/redux/features/projects/slice";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetProjectsQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading(true));
    } else {
      dispatch(setLoading(false));
      if (data) {
        dispatch(setProjects(data));
      } else {
        dispatch(setProjects([]));
      }
    }
  }, [data, isLoading, dispatch]);

  if (isLoading) {
    return (
      <div className="fixed h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <AppSidebar className="fixed inset-y-0 z-50" />
        <div className="flex flex-1 flex-col w-full">
          <AppTopbar />

          <main className={cn("flex-1 space-y-4 md:p-8 pt-2 w-full")}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
