"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopNav } from "@/components/app-topnav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLayout } from "@/components/layout-provider";
import { cn } from "@/lib/utils";

import { GlobalHeader } from "@/components/layout-elements/global-header";
import { useSession } from "next-auth/react";
import { canAccess } from "@/lib/rbac";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { layoutType } = useLayout();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  
  const isAllowed = canAccess(role, pathname);
  
  return (
    <SidebarProvider defaultOpen={layoutType === "sidebar"}>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <GlobalHeader />
        <div className="flex-1 flex overflow-hidden">
          {layoutType === "sidebar" && <AppSidebar />}
          <SidebarInset className="bg-background flex flex-col">
            <main className={cn(
              "flex-1",
              !(pathname.startsWith("/incidents/") && pathname.split("/").length >= 3) && "p-4 lg:px-6 lg:py-2"
            )}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {isAllowed ? children : (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                      <div className="size-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert className="size-8" />
                      </div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
                      <p className="text-muted-foreground max-w-[400px] mb-8">
                        Your account role does not have the necessary permissions to access the <span className="font-bold text-foreground">{pathname}</span> module.
                      </p>
                      <Button asChild className="bg-[#0176D3] hover:bg-[#014486] rounded-sm h-10 px-8">
                        <Link href="/dashboard">Return to Dashboard</Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
            <Footer />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#1A1A1A] border-t h-14 flex items-center px-6 shrink-0 mt-auto">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-medium text-muted-foreground">
          © {new Date().getFullYear()} QTrack Incident Management
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Developed and Maintained by MMI IT Team
        </span>
      </div>
    </footer>
  );
}
