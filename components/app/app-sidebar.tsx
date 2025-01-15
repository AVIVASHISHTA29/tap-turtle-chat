"use client";

import { Bot, House, Monitor, Video } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProjectSwitcher } from "./project-switcher";

interface SidebarItems {
  title: string;
  url: string;
  icon: React.ElementType;
  matchPath?: (pathname: string) => boolean;
}

const items: SidebarItems[] = [
  {
    title: "Home",
    url: "/",
    icon: House,
    matchPath: (pathname) => pathname === "/",
  },
  {
    title: "AI Chat",
    url: "/chat",
    icon: Bot,
    matchPath: (pathname) => pathname.startsWith("/chat"),
  },
  {
    title: "Recordings",
    url: "/recordings",
    icon: Video,
    matchPath: (pathname) => pathname.startsWith("/recordings"),
  },
  {
    title: "API Monitoring",
    url: "/errors",
    icon: Monitor,
    matchPath: (pathname) => pathname.startsWith("/errors"),
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = item.matchPath?.(pathname) ?? false;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(isActive && "bg-accent")}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
