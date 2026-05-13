"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Building2,
  ShieldCheck,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout-provider";
import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";
import { Logo } from "@/components/layout-elements/logo";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Incidents", url: "/incidents", icon: AlertCircle },
  { title: "Organization", url: "/org", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Audit Trail", url: "/audit-trail", icon: ShieldCheck },
  { title: "Master Data", url: "/masters", icon: Database },
];

export function AppTopNav() {
  const pathname = usePathname();
  const { toggleLayout } = useLayout();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const filteredNavMain = navMain.filter((item) => canAccess(role, item.url));

  return (
    <header className="h-14 w-full border-b bg-background sticky top-0 z-50 px-6 flex items-center justify-between overflow-hidden">
      <div className="flex items-center gap-8 h-full">
        <Logo />
 
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

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-none border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
           Layout: Top Navigation
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleLayout}
          title="Switch to Sidebar Navigation"
          className="size-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ShieldCheck className="size-5" />
        </Button>
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />
        <UserNav />
      </div>
    </header>
  );
}

import { Separator } from "@/components/ui/separator";
