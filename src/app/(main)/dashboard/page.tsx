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
  Zap,
  History,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Star,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const session = await checkAuth();
  const user = session.user as any;
  const accessFilter = getIncidentAccessFilter(user);

  // FETCH DATA
  const [
    totalIncidents,
    resolvedIncidents,
    openIncidents,
    allIncidents,
    recentLogs,
    resolvers
  ] = await Promise.all([
    prisma.incident.count({ where: accessFilter }),
    prisma.incident.count({ where: { ...accessFilter, status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.incident.count({ where: { ...accessFilter, status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] } } }),
    prisma.incident.findMany({
      where: accessFilter,
      include: { assignee: true, reporter: true },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.incidentLog.findMany({
      where: getLogAccessFilter(user),
      include: { user: true, incident: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.user.findMany({
      where: { role: "RESOLVER", companyId: user.companyId },
      include: {
        assignedIncidents: {
          where: { status: { in: ["RESOLVED", "CLOSED"] } }
        },
        _count: { select: { assignedIncidents: true } }
      },
      take: 5
    })
  ]);

  // CALCULATE TRENDS (MOCK FOR SPARKLINE)
  const sparklineData = [10, 15, 8, 12, 20, 18, 25];
  
  // CALCULATE MTTR
  const mttr = 4.2; // Mocking for now as we need log-based calculation
  
  // CALCULATE ANALYST STATS
  const analystStats = resolvers.map(r => ({
    name: r.name,
    incidents: r._count.assignedIncidents,
    avgTime: "3.8 hrs",
    satisfaction: 4.5 + (Math.random() * 0.5)
  })).sort((a, b) => b.incidents - a.incidents);

  return (
    <div className="space-y-8 pb-20 px-6 bg-[#F8F9FB] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl">
            Track key metrics and identify areas for improvement to optimize incident response and service quality.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/audit-trail">
            <Button variant="outline" className="h-10 font-bold text-xs uppercase tracking-widest px-6 border-slate-200">
              <History className="size-4 mr-2" /> Audit Trail
            </Button>
          </Link>
          <Link href="/incidents/create">
            <Button className="h-10 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-xs uppercase tracking-widest px-8 shadow-sm">
              <Zap className="size-4 mr-2" /> New Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TOTAL INCIDENTS */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Incidents</p>
                <h3 className="text-3xl font-bold tabular-nums">{totalIncidents}</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                <TrendingUp className="size-3" /> 4%
              </div>
            </div>
            <div className="h-16 flex items-end gap-1">
              {sparklineData.map((v, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-[#0176D3]/10 hover:bg-[#0176D3]/20 transition-colors rounded-t-sm" 
                  style={{ height: `${(v / 30) * 100}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AVERAGE MTTR */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average MTTR</p>
                <h3 className="text-3xl font-bold tabular-nums">{mttr} hours</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                <TrendingUp className="size-3" /> 2%
              </div>
            </div>
            <div className="relative h-20 flex flex-col items-center justify-end overflow-hidden">
               <svg viewBox="0 0 100 50" className="w-full max-w-[120px]">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 10 50 A 40 40 0 0 1 70 20" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
               </svg>
               <div className="absolute bottom-0 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Optimal Range</div>
            </div>
          </CardContent>
        </Card>

        {/* OPEN INCIDENTS */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Open Incidents</p>
                <h3 className="text-3xl font-bold tabular-nums">{openIncidents}</h3>
              </div>
              <div className="flex items-center gap-1 text-rose-500 font-bold text-xs">
                <TrendingDown className="size-3" /> 2%
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="relative size-16">
                  <svg viewBox="0 0 36 36" className="size-full">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#0176D3" strokeWidth="4" strokeDasharray={`${(totalIncidents > 0 ? (resolvedIncidents/totalIncidents)*100 : 0)}, 100`} />
                  </svg>
               </div>
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                    <div className="size-2 rounded-full bg-[#0176D3]" /> 
                    <span>{totalIncidents > 0 ? Math.round((resolvedIncidents/totalIncidents)*100) : 0}% Resolved</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                    <div className="size-2 rounded-full bg-slate-200" /> 
                    <span>{totalIncidents > 0 ? Math.round((openIncidents/totalIncidents)*100) : 0}% Open</span>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA COMPLIANCE */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SLA Compliance</p>
                <h3 className="text-3xl font-bold tabular-nums">96.4%</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                <TrendingUp className="size-3" /> 1.2%
              </div>
            </div>
            <div className="h-16 w-full flex items-center justify-center">
              <svg viewBox="0 0 200 40" className="w-full overflow-visible">
                <path d="M 0 30 Q 50 10 100 25 T 200 15" fill="none" stroke="#0176D3" strokeWidth="2" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ANALYST PERFORMANCE */}
        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-lg font-bold">Analyst Performance Overview</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-[#0176D3]">View all <ChevronRight className="size-3 ml-1" /></Button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="grid grid-cols-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-3">
                <span className="col-span-1">Analyst Name</span>
                <span className="text-center">Incidents</span>
                <span className="text-center">Avg. Time</span>
                <span className="text-right">Satisfaction</span>
              </div>
              {analystStats.map((a, i) => (
                <div key={i} className="grid grid-cols-4 items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-[#0176D3]/10 group-hover:text-[#0176D3] transition-colors uppercase">
                      {a.name?.substring(0, 2) || "NA"}
                    </div>
                    <span className="text-sm font-bold text-foreground">{a.name}</span>
                  </div>
                  <span className="text-center text-sm font-medium">{a.incidents}</span>
                  <span className="text-center text-sm font-medium">{a.avgTime}</span>
                  <div className="flex items-center justify-end gap-1 text-amber-500">
                    <Star className="size-3 fill-current" />
                    <span className="text-xs font-black">{a.satisfaction.toFixed(1)}/5</span>
                  </div>
                </div>
              ))}
              {analystStats.length === 0 && (
                 <div className="text-center py-10 text-muted-foreground italic text-sm">No analyst data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* INCIDENT TRACKING */}
        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-lg font-bold">Incident Tracking</CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Last 5 Activities</div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
               <div className="grid grid-cols-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-3">
                <span>ID</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Assigned</span>
                <span className="text-right">Action</span>
              </div>
              {allIncidents.slice(0, 5).map((inc) => (
                 <div key={inc.id} className="grid grid-cols-5 items-center group">
                    <Link href={`/incidents/${inc.id}`} className="text-xs font-black text-[#0176D3] hover:underline uppercase tracking-tight">
                      #{inc.ticketId.split('-')[1]}
                    </Link>
                    <div>
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-black rounded-sm uppercase px-1.5 h-5",
                        inc.priority === "CRITICAL" ? "bg-rose-50 text-rose-600 border-rose-100" :
                        inc.priority === "HIGH" ? "bg-orange-50 text-orange-600 border-orange-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {inc.priority}
                      </Badge>
                    </div>
                    <div className="text-[10px] font-bold text-foreground capitalize">{inc.status.replace(/_/g, ' ').toLowerCase()}</div>
                    <div className="flex items-center gap-2">
                       <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase">
                          {inc.assignee?.name?.substring(0, 2) || "NA"}
                       </div>
                       <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">{inc.assignee?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-end">
                       <Link href={`/incidents/${inc.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#0176D3]/10 hover:text-[#0176D3]">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </Link>
                    </div>
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Badge = ({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) => (
  <span className={cn(
    "inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    variant === "outline" ? "text-foreground border-input bg-background" : 
    variant === "secondary" ? "bg-secondary text-secondary-foreground border-transparent" :
    "bg-primary text-primary-foreground border-transparent",
    className
  )}>
    {children}
  </span>
);

function getActionLabel(action: string) {
  if (!action) return "performed an action";
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
