"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RootState } from "@/redux/store";
import { Activity, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ErrorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedProject = useSelector(
    (state: RootState) => state.projects.selectedProject
  );
  const router = useRouter();

  useEffect(() => {
    if (!selectedProject) {
      router.push("/projects");
    }
  }, [selectedProject, router]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Observability
              </h2>
              <p className="text-sm text-muted-foreground">
                Monitor your API requests and responses
              </p>
            </div>
            <Separator />
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => router.push("/errors")}
              >
                <Activity className="mr-2 h-4 w-4" />
                By Project
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => router.push("/errors/sessions")}
              >
                <List className="mr-2 h-4 w-4" />
                By Sessions
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
