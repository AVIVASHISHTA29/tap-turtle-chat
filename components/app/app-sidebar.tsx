"use client";

import { Bug, ChartArea, House, Video } from "lucide-react";

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

import Link from "next/link";
import { ProjectSwitcher } from "./project-switcher";

interface SidebarItems {
  title: string;
  url: string;
  icon: React.ElementType;
}

const items: SidebarItems[] = [
  {
    title: "Home",
    url: "/",
    icon: House,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: ChartArea,
  },
  // {
  //   title: "Projects",
  //   url: "/projects",
  //   icon: PanelsTopLeft,
  // },
  {
    title: "Recordings",
    url: "/recordings",
    icon: Video,
  },
  {
    title: "API Errors",
    url: "/errors",
    icon: Bug,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      {/* <SidebarFooter>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}
