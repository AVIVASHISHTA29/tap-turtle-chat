"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Bell, ChevronDown, Settings } from "lucide-react";
import { useSidebar } from "../ui/sidebar";

type AppTopbarProps = React.HTMLAttributes<HTMLDivElement>;

export function AppTopbar({ className, ...props }: AppTopbarProps) {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
        isExpanded ? "h-16" : "h-12",
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
          <Button
            variant="ghost"
            size={isExpanded ? "icon" : "sm"}
            className="relative hover:bg-muted/50"
          >
            <Bell
              className={cn(
                "transition-all duration-300",
                isExpanded ? "h-4 w-4" : "h-3.5 w-3.5"
              )}
            />
            <span
              className={cn(
                "absolute rounded-full bg-red-600 transition-all duration-300",
                isExpanded
                  ? "right-2 top-2 h-2 w-2"
                  : "right-1.5 top-1.5 h-1.5 w-1.5"
              )}
            />
          </Button>

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
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
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
