"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  AlertCircle, 
  ShieldCheck, 
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
  { title: "Audit Trail", url: "/audit-trail", icon: ShieldCheck },
  { title: "Master Data", url: "/masters", icon: Database },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const { layoutType, toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const filteredNavMain = navMain.filter((item) => canAccess(role, item.url));
  
  const { toggleSidebar, state } = useSidebar();

  if (layoutType === "sidebar") return null;

  return (
    <header className="h-14 border-b bg-background sticky top-0 z-50 flex items-center w-full px-6 justify-between">
      <div className="flex items-center h-full">
        <Logo showText={true} />
        
        <div className="ml-6 flex items-center h-full">
          <nav className="hidden md:flex items-center h-full">
            {filteredNavMain.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex items-center h-14 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                    isActive 
                      ? "text-[#0176D3] border-[#0176D3] bg-blue-50/50" 
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="size-4 mr-2" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

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
    </header>
  );
}
