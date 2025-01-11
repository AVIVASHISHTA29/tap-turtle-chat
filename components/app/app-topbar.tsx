"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  clearSelectedRecordings,
  setGroupAnalysis,
} from "@/redux/features/projects/slice";
import { RootState } from "@/redux/store";
import { UserButton } from "@clerk/nextjs";
import { Cctv, ChevronDown, Settings, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSidebar } from "../ui/sidebar";

type AppTopbarProps = React.HTMLAttributes<HTMLDivElement>;

const EXPANDED_HEIGHT = "h-16";
const COLLAPSED_HEIGHT = "h-12";

export function AppTopbar({ className, ...props }: AppTopbarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const router = useRouter();
  const dispatch = useDispatch();
  const { groupAnalysis } = useSelector((state: RootState) => state.projects);

  const isExpanded = state === "expanded";
  const heightClass = isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  const isRecording = useMemo(() => pathname === "/recordings", [pathname]);
  const isSpecificRecording = useMemo(
    () => pathname.includes("/recordings/"),
    [pathname]
  );

  const handleGroupAnalysisToggle = useCallback(() => {
    dispatch(setGroupAnalysis(!groupAnalysis));
    if (groupAnalysis) {
      dispatch(clearSelectedRecordings());
    }
  }, [dispatch, groupAnalysis]);

  const handleSpecificRecordingAnalysis = useCallback(() => {
    router.push("/recordings");
    dispatch(setGroupAnalysis(true));
  }, [router, dispatch]);

  const renderAnalysisButton = () => {
    if (isRecording) {
      return groupAnalysis ? (
        <Button variant="destructive" onClick={handleGroupAnalysisToggle}>
          <Cctv className="h-4 w-4" />
          Close Custom AI Analysis
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" onClick={handleGroupAnalysisToggle}>
          <Cctv className="h-4 w-4" />
          Custom AI Analysis
        </Button>
      );
    }

    if (isSpecificRecording) {
      return (
        <Button variant="outline" onClick={handleSpecificRecordingAnalysis}>
          <Cctv className="h-4 w-4" />
          Custom AI Analysis
        </Button>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
        heightClass,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "container flex max-w-full items-center h-full px-4 transition-all duration-300 ease-in-out",
          isExpanded ? "gap-4" : "gap-2"
        )}
      >
        <div className="flex flex-1" />
        <div
          className={cn(
            "flex items-center transition-all duration-300 ease-in-out",
            isExpanded ? "gap-4" : "gap-2"
          )}
        >
          {renderAnalysisButton()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 hover:bg-muted/50",
                  isExpanded ? "px-3 py-2" : "px-2 py-1.5"
                )}
              >
                <Settings
                  className={cn(
                    "transition-all duration-300",
                    isExpanded ? "h-4 w-4" : "h-3.5 w-3.5"
                  )}
                />
                <span className="hidden sm:inline-block">Settings</span>
                <ChevronDown
                  className={cn(
                    "opacity-50 transition-all duration-300",
                    isExpanded ? "h-3 w-3" : "h-2.5 w-2.5"
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel
                onClick={() => router.push("/projects")}
                className="cursor-pointer"
              >
                Projects
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className={cn(
              "bg-border transition-all duration-300",
              isExpanded ? "h-6 w-px" : "h-5 w-px"
            )}
          />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: cn(
                  "transition-all duration-300",
                  isExpanded ? "h-8 w-8" : "h-7 w-7"
                ),
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
