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
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Inbox,
  AlertTriangle,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await checkAuth();
  const user = session.user as any;
  const accessFilter = getIncidentAccessFilter(user);

  const [
    totalCount,
    newCount,
    assignedCount,
    wipCount,
    resolvedCount,
    closedCount,
    rejectedCount,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    recentLogs
  ] = await Promise.all([
    prisma.incident.count({ where: accessFilter }),
    prisma.incident.count({ where: { ...accessFilter, status: "NEW" } }),
    prisma.incident.count({ where: { ...accessFilter, status: "ASSIGNED" } }),
    prisma.incident.count({ where: { ...accessFilter, status: "IN_PROGRESS" } }),
    prisma.incident.count({ where: { ...accessFilter, status: "RESOLVED" } }),
    prisma.incident.count({ where: { ...accessFilter, status: "CLOSED" } }),
    prisma.incident.count({ where: { ...accessFilter, status: "REJECTED" } }),
    prisma.incident.count({ where: { ...accessFilter, priority: "CRITICAL" } }),
    prisma.incident.count({ where: { ...accessFilter, priority: "HIGH" } }),
    prisma.incident.count({ where: { ...accessFilter, priority: "MEDIUM" } }),
    prisma.incident.count({ where: { ...accessFilter, priority: "LOW" } }),
    prisma.incidentLog.findMany({
      where: getLogAccessFilter(user),
      include: { user: true, incident: true },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const activeCount = newCount + assignedCount + wipCount;
  const efficiency = totalCount > 0 ? Math.round(((resolvedCount + closedCount) / totalCount) * 100) : 100;

  return (
    <div className="space-y-6 pb-20 px-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="size-5 text-[#0176D3]" />
            Command Center
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Operational Intelligence • {user.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/audit-trail">
            <Button variant="outline" size="sm" className="h-9 font-bold text-[10px] uppercase tracking-wider px-4 gap-2">
              <History className="size-3.5" /> Full Audit
            </Button>
          </Link>
          <Link href="/incidents/create">
            <Button size="sm" className="h-9 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-[10px] uppercase tracking-wider px-6 shadow-lg shadow-blue-500/20">
              New Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* CORE KPI GRID (COMPACT & COLORED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
        {[
          { label: "Active", value: activeCount, icon: Inbox, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Critical", value: criticalCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
          { label: "WIP", value: wipCount, icon: Activity, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Efficiency", value: `${efficiency}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        ].map((kpi, idx) => (
          <div key={idx} className={cn("p-4 border rounded-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5", kpi.bg, kpi.border)}>
            <div className={cn("p-2 rounded-sm bg-white/80 shadow-sm", kpi.color)}>
              <kpi.icon className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{kpi.label}</span>
              <span className="text-xl font-bold tracking-tight">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SECTION: STATUS & PRIORITY */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border shadow-none rounded-sm">
            <CardHeader className="p-4 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="size-4 text-[#0176D3]" />
                Status Distribution
              </CardTitle>
              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 rounded-none uppercase">{totalCount} Total</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {[
                { label: "New", count: newCount, color: "bg-blue-500" },
                { label: "Assigned", count: assignedCount, color: "bg-indigo-500" },
                { label: "In Progress", count: wipCount, color: "bg-amber-500" },
                { label: "Resolved", count: resolvedCount, color: "bg-emerald-500" },
                { label: "Rejected", count: rejectedCount, color: "bg-red-500" },
              ].map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="text-foreground">{s.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", s.color)} 
                      style={{ width: `${totalCount > 0 ? (s.count / totalCount) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border shadow-none rounded-sm">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-500" />
                Priority Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Critical", count: criticalCount, color: "text-red-600 bg-red-50 border-red-100" },
                  { label: "High", count: highCount, color: "text-orange-600 bg-orange-50 border-orange-100" },
                  { label: "Medium", count: mediumCount, color: "text-amber-600 bg-amber-50 border-amber-100" },
                  { label: "Low", count: lowCount, color: "text-blue-600 bg-blue-50 border-blue-100" },
                ].map((p) => (
                  <div key={p.label} className={cn("p-3 border rounded-sm text-center", p.color)}>
                    <div className="text-lg font-bold">{p.count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider">{p.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SECTION: ACTIVITY FEED */}
        <Card className="lg:col-span-8 border shadow-none rounded-sm flex flex-col">
          <CardHeader className="p-4 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Activity className="size-4 text-[#0176D3]" />
              Operational Activity
            </CardTitle>
            <Link href="/audit-trail" className="text-[10px] font-bold text-[#0176D3] hover:underline uppercase tracking-wider">
              View All Activity
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-50 border flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-[#0176D3]/30 group-hover:text-[#0176D3] transition-all">
                      {log.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5 max-w-[500px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-[#0176D3] uppercase tracking-tighter">
                          {log.incident.ticketId}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-xs font-bold text-foreground">
                          {log.user.name} <span className="font-medium text-muted-foreground">{getActionLabel(log.action)}</span>
                        </span>
                      </div>
                      <div 
                        className="text-[11px] text-muted-foreground line-clamp-1 italic font-medium"
                        dangerouslySetInnerHTML={{ __html: log.content.replace(/<[^>]*>?/gm, ' ') }}
                      />
                      <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                        {format(new Date(log.createdAt), "HH:mm • MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <Link href={`/incidents/${log.incidentId}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#0176D3]/10 hover:text-[#0176D3] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <History className="size-12 text-muted-foreground/10 mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No recent activity detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "created this incident",
    COMMENT: "posted an update",
    STATUS_CHANGE: "updated the status",
    ASSIGNMENT: "assigned the incident",
    DETAIL_UPDATE: "modified incident details",
    RESOLUTION: "resolved the ticket",
    REJECTION: "rejected the request",
  };
  return labels[action] || action.toLowerCase().replace("_", " ");
}

const Badge = ({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) => (
  <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    variant === "outline" ? "text-foreground border border-input bg-background" : "bg-primary text-primary-foreground",
    className
  )}>
    {children}
  </span>
);

