"use client";

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
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout-provider";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Incidents", url: "/incidents", icon: AlertCircle },
  { title: "Organization", url: "/org", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Master Data", url: "/masters", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings },
];

import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";

export function AppTopNav() {
  const pathname = usePathname();
  const { toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredNavMain = navMain.filter((item) => canAccess(role, item.url));

  return (
    <header className="h-14 w-full border-b bg-background sticky top-0 z-50 px-6 flex items-center justify-between overflow-hidden">
      <div className="flex items-center gap-8 h-full">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <div className="h-7 w-7 bg-primary flex items-center justify-center rounded-none">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">Resolve</span>
        </Link>
 
        <nav className="hidden md:flex items-center h-full">
          {filteredNavMain.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "h-14 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-none border-b-2 rounded-none",
                  isActive 
                    ? "border-primary text-primary bg-primary/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="size-3.5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon-sm" 
          onClick={toggleLayout}
          title="Switch to Sidebar"
          className="text-muted-foreground hover:text-foreground rounded-none"
        >
          <LayoutIcon className="size-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <ThemeToggle />
        <div className="ml-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
