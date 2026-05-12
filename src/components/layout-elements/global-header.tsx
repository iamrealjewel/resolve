"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  AlertCircle, 
  BarChart3, 
  Settings, 
  Users, 
  Building2, 
  Database,
  Layout as LayoutIcon,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout-provider";
import { Logo } from "./logo";
import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Incidents", url: "/incidents", icon: AlertCircle },
  { title: "Users", url: "/users", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Master Data", url: "/masters", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const { layoutType, toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredNavMain = navMain.filter((item) => canAccess(role, item.url));
  
  const { toggleSidebar, state } = useSidebar();

  if (layoutType === "sidebar") return null;

  return (
    <header className="h-14 border-b bg-background sticky top-0 z-50 flex items-center w-full px-6 justify-between">
      <div className={cn(
        "flex items-center h-full px-4 transition-all duration-300",
        layoutType === "sidebar" 
          ? (state === "expanded" ? "w-[var(--sidebar-width)] border-r" : "w-[var(--sidebar-width-icon)] border-r")
          : "flex-1"
      )}>
        <Logo showText={layoutType === "topnav" || state === "expanded"} />
        
        {layoutType === "sidebar" && state === "expanded" && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 ml-auto"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </Button>
        )}

        {layoutType === "topnav" && (
          <div className="ml-6 flex items-center h-full">
            <nav className="hidden md:flex items-center h-full">
              {filteredNavMain.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "h-14 px-5 flex items-center gap-2 text-sm font-medium transition-colors border-b-[3px]",
                      isActive 
                        ? "border-[#0176D3] text-[#0176D3]" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {layoutType === "sidebar" && state === "collapsed" && (
        <div className="px-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      )}

      {layoutType === "topnav" && (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleLayout}
            title="Switch to Sidebar"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <LayoutIcon className="size-4" />
          </Button>
          <ThemeToggle />
          <div className="ml-2">
            <UserNav />
          </div>
        </div>
      )}
    </header>
  );
}
