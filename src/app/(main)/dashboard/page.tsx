import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth-utils";
import { getIncidentAccessFilter, getLogAccessFilter } from "@/lib/access-control";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  AlertCircle, 
  Clock, 
  Activity,
  ShieldAlert,
  ArrowRight,
  Zap,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await checkAuth();
  const user = session.user as any;
  const accessFilter = getIncidentAccessFilter(user);

  const [totalActive, highPriority, pendingApproval, resolvedCount] = await Promise.all([
    prisma.incident.count({
      where: {
        ...accessFilter,
        status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] }
      }
    }),
    prisma.incident.count({
      where: {
        ...accessFilter,
        priority: { in: ["HIGH", "CRITICAL"] },
        status: { notIn: ["CLOSED", "RESOLVED", "REJECTED"] }
      }
    }),
    prisma.incident.count({
      where: {
        ...accessFilter,
        status: { in: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] }
      }
    }),
    prisma.incident.count({
      where: {
        ...accessFilter,
        status: "RESOLVED"
      }
    })
  ]);

  const recentLogs = await prisma.incidentLog.findMany({
    where: getLogAccessFilter(user),
    include: {
      user: true,
      incident: true
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const efficiency = totalActive + resolvedCount > 0 
    ? Math.round((resolvedCount / (totalActive + resolvedCount)) * 100) 
    : 100;

  return (
    <div className="space-y-6 pb-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Command Center
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Real-time incident intelligence for {user.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-8 font-semibold text-xs px-4">Analytics</Button>
          </Link>
          <Link href="/incidents/create">
            <Button size="sm" className="h-8 bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-xs px-4">New Incident</Button>
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {[
          { label: "Active Incidents", value: totalActive, icon: Activity, color: "text-[#0176D3]", bg: "bg-blue-50" },
          { label: "Critical/High", value: highPriority, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Pending Approval", value: pendingApproval, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolution Rate", value: `${efficiency}%`, icon: ShieldAlert, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border shadow-none rounded-sm">
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <div className={cn("p-1.5 rounded-sm", kpi.bg)}>
                <kpi.icon className={cn("size-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* RECENT ACTIVITY */}
        <Card className="col-span-4 border shadow-none rounded-sm">
          <CardHeader className="p-4 border-b bg-muted/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              Operational Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-[#0176D3]/10 text-[#0176D3] flex items-center justify-center text-xs font-bold uppercase">
                      {log.user.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{log.action.replace("_", " ")}</span>
                        <span className="text-[10px] font-bold text-[#0176D3] bg-blue-50 px-1.5 py-0.5 rounded uppercase">{log.incident.ticketId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {log.user.name} • {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Link href={`/incidents/${log.incidentId}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#0176D3]/10 hover:text-[#0176D3]">
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="p-10 text-center text-muted-foreground italic text-sm">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE MATRIX */}
        <Card className="col-span-3 border shadow-none rounded-sm">
          <CardHeader className="p-4 border-b bg-muted/5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Efficiency Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Resolution Progress</span>
                <span>{efficiency}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0176D3] rounded-full transition-all duration-1000" 
                  style={{ width: `${efficiency}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2 text-center pt-4">
              <div className="size-24 mx-auto rounded-full border-4 border-blue-50 border-t-[#0176D3] flex items-center justify-center animate-in zoom-in duration-700">
                <span className="text-2xl font-bold">{efficiency}</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">Resolution Efficiency Score</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

