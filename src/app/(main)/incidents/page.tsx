import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Plus, Search, Filter, MoreHorizontal, AlertCircle, MapPin, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IncidentsTable } from "./incidents-table";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getIncidents, getIncidentStats } from "@/app/actions/incidents";

async function getIncidentCounts(user: any) {
  const [allCount, myCount, pendingCount] = await Promise.all([
    prisma.incident.count({ 
      where: { 
        ...(user.role === "SUPER_ADMIN" ? {} : 
           { 
             companyId: user.companyId,
             ...(user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER" ? 
               { OR: [{ departmentId: user.departmentId }, { reporter: { superiorId: user.id } }, { accessList: { some: { id: user.id } } }] } : 
             (user.role === "RESOLVER" ? 
               { 
                 AND: [
                   { OR: [
                     { departmentId: user.departmentId }, 
                     { accessList: { some: { id: user.id } } }
                   ]},
                   { status: { notIn: ["PENDING_RAISER_APPROVAL", "PENDING_RESOLVER_APPROVAL"] } }
                 ]
               } : 
               { OR: [{ reporterId: user.id }, { accessList: { some: { id: user.id } } }] }))
           })
      } 
    }),
    prisma.incident.count({ where: { reporterId: user.id, companyId: user.companyId } }),
    prisma.incident.count({ 
      where: { 
        ...(user.role === "SUPER_ADMIN" ? {} : { companyId: user.companyId }),
        OR: [
          { raiserApproverId: user.id, status: "PENDING_RAISER_APPROVAL" },
          { resolverApproverId: user.id, status: "PENDING_RESOLVER_APPROVAL" }
        ]
      } 
    }),
  ]);

  return { allCount, myCount, pendingCount };
}

export default async function IncidentsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "all";
  
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return null;

  const [incidents, stats, companies, locations, categories, departments] = await Promise.all([
    getIncidents(activeTab),
    getIncidentStats(user),
    prisma.company.findMany(),
    prisma.location.findMany(),
    prisma.incidentCategory.findMany(),
    prisma.department.findMany(),
  ]);
  
  const { allCount, myCount, pendingCount } = stats;

  const tabs = [
    { id: "all", label: "All Records", count: allCount },
    { id: "my", label: "My Incidents", count: myCount },
    { id: "pending", label: "Pending Approvals", count: pendingCount },
  ];

  return (
    <div className="space-y-6 pb-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Incident Registry
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {activeTab === "pending" ? "Review pending requests" : 
             activeTab === "my" ? "Track your reports" :
             "Manage organizational incidents"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/incidents/create" 
            className={cn(
              buttonVariants({ size: "sm" }), 
              "font-bold text-xs px-4 h-8 bg-[#0176D3] hover:bg-[#014486] text-white"
            )}
          >
            <Plus className="mr-1.5 size-3.5" /> Report New
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center border-b">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/incidents?tab=${tab.id}`}
                className={cn(
                  "px-6 py-3 text-sm font-semibold transition-all border-b-[3px] -mb-px flex items-center gap-2.5",
                  isActive 
                    ? "border-[#0176D3] text-[#0176D3]" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-sm text-[10px] font-bold border",
                  isActive ? "bg-[#0176D3] text-white border-[#0176D3]" : "bg-muted text-muted-foreground border-border"
                )}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        <IncidentsTable 
          incidents={incidents} 
          companies={companies}
          locations={locations}
          categories={categories}
          departments={departments}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
