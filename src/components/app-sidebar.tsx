"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Building2,
  ShieldCheck,
  Layout as LayoutIcon,
  Database,
  Menu
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
import { useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/layout-elements/logo";

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Incidents", url: "/incidents", icon: AlertCircle },
    { title: "Users", url: "/users", icon: Users },
    { title: "Audit Trail", url: "/audit-trail", icon: ShieldCheck },
    { title: "Master Data", url: "/masters", icon: Database },
  ],
  secondary: [],
};

import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { toggleSidebar, state } = useSidebar();

  const filteredNavMain = data.navMain.filter((item) => canAccess(role, item.url));


  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props} className="border-r border-border">
      <SidebarHeader className={cn(
        "flex shrink-0 transition-all duration-300 overflow-hidden",
        state === "expanded" ? "h-14 flex-row items-center justify-between px-6" : "flex-col items-center justify-start gap-4 pt-[12px] pb-4 px-0"
      )}>
        <Logo showText={state === "expanded"} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-9 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="size-5" />
        </Button>
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

        {/* Collapsed-only: layout + theme pinned to bottom of content */}
        {state === "collapsed" && (
          <div className="mt-auto flex flex-col items-center gap-1 pb-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLayout}
              title="Switch to Top Navigation"
              className="size-9 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LayoutIcon className="size-4" />
            </Button>
            <ThemeToggle />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t h-14 flex shrink-0 items-center transition-all duration-300",
        state === "expanded" ? "flex-row justify-between px-4" : "justify-center px-0"
      )}>
        {state === "expanded" ? (
          <>
            <UserNav />
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLayout}
                title="Switch to Top Navigation"
                className="size-8 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <LayoutIcon className="size-4" />
              </Button>
              <ThemeToggle />
            </div>
          </>
        ) : (
          <UserNav />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
