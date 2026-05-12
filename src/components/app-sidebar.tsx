"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  Building2,
  HelpCircle,
  ShieldCheck,
  Layout as LayoutIcon,
  Database,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout-provider";

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Incidents", url: "/incidents", icon: AlertCircle },
    { title: "Users", url: "/users", icon: Users },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Master Data", url: "/masters", icon: Database },
  ],
  secondary: [
    { title: "Support", url: "/support", icon: HelpCircle },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
};

import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredNavMain = data.navMain.filter((item) => canAccess(role, item.url));
  const filteredSecondary = data.secondary.filter((item) => canAccess(role, item.url));

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props} className="border-r border-border">
      <SidebarHeader className="h-14 border-b border-border px-4 flex items-center">
        <span className="text-[10px] font-semibold text-muted-foreground/60 group-data-[collapsible=icon]:hidden">NAVIGATION</span>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 mb-1 text-[10px] font-semibold text-muted-foreground/50">CORE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavMain.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "h-9 transition-colors border-l-[3px] mx-0 px-4 rounded-none",
                        isActive 
                          ? "border-[#0176D3] bg-blue-50/50 text-[#0176D3] font-semibold" 
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 mb-1 text-[10px] font-semibold text-muted-foreground/50">SYSTEM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSecondary.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "h-9 transition-colors border-l-[3px] mx-0 px-4 rounded-none",
                        isActive 
                          ? "border-[#0176D3] bg-blue-50/50 text-[#0176D3] font-semibold" 
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLayout}
                title="Switch Navigation Mode"
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                <LayoutIcon className="size-4" />
              </Button>
              <ThemeToggle />
          </div>
          <UserNav />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
