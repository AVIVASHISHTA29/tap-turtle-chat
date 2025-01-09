"use client";

import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
  }, [data, isLoading]);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        {isLoading ? (
          <div className="flex items-center justify-center h-screen w-full">
            <Loader2 className="animate-spin size-6" />
          </div>
        ) : (
          <main className="w-full">{children}</main>
        )}
      </SidebarProvider>
    </>
  );
}

export default DashboardLayout;
