import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Download, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkAuth } from "@/lib/auth-utils";
import { getIncidentAccessFilter } from "@/lib/access-control";

async function getReportData(user: any) {
  const accessFilter = getIncidentAccessFilter(user);

  const [totalIncidents, resolvedIncidents, criticalIncidents] = await Promise.all([
    prisma.incident.count({ where: accessFilter }),
    prisma.incident.count({ where: { ...accessFilter, status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.incident.count({ where: { ...accessFilter, priority: "CRITICAL" } }),
  ]);

  const companies = await prisma.company.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { id: user.companyId },
    include: {
      _count: { 
        select: { 
          incidents: {
            where: accessFilter
          } 
        } 
      }
    }
  });

  return { totalIncidents, resolvedIncidents, criticalIncidents, companies };
}

export default async function ReportsPage() {
  const session = await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER"]);
  const user = session.user as any;
  const data = await getReportData(user);

  const efficiency = data.totalIncidents > 0 
    ? ((data.resolvedIncidents / data.totalIncidents) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-8 px-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-6 border-b">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics Hub</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Personalized performance metrics for {user.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-bold text-[10px] uppercase tracking-widest px-6">
            <Download className="mr-2 size-3.5" /> Export Data
          </Button>
          <Button size="sm" className="h-9 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-[10px] uppercase tracking-widest px-8">
            <FileText className="mr-2 size-3.5" /> Generate PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Efficiency Rate", value: `${efficiency}%`, icon: TrendingUp, color: "text-emerald-500", sub: "Resolved vs Total" },
          { label: "System Pressure", value: data.criticalIncidents, icon: Activity, color: "text-red-500", sub: "Critical Tickets" },
          { label: "Lifecycle Volume", value: data.totalIncidents, icon: BarChart3, color: "text-[#0176D3]", sub: "Authorized View" },
        ].map((kpi, i) => (
          <Card key={i} className="border shadow-none rounded-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={cn("size-4", kpi.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</div>
              <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border shadow-none rounded-sm">
          <CardHeader className="p-6 pb-2 border-b bg-muted/5">
            <CardTitle className="text-sm font-bold">Organizational Distribution</CardTitle>
            <CardDescription className="text-xs">Incident load across entities you manage.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {data.companies.map((company) => (
               <div key={company.id} className="space-y-2">
                 <div className="flex items-center justify-between text-xs font-bold">
                   <span className="text-muted-foreground">{company.name}</span>
                   <span className="text-foreground">{company._count.incidents} Tickets</span>
                 </div>
                 <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0176D3] rounded-full transition-all duration-700" 
                      style={{ width: `${data.totalIncidents > 0 ? (company._count.incidents / data.totalIncidents) * 100 : 0}%` }}
                    />
                 </div>
               </div>
            ))}
            {data.companies.length === 0 && (
              <div className="h-40 flex items-center justify-center text-muted-foreground italic text-xs uppercase tracking-widest font-bold">
                No data within your scope
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border shadow-none rounded-sm bg-muted/5">
          <CardHeader className="p-6 pb-2 border-b">
            <CardTitle className="text-sm font-bold">Health Diagnostic</CardTitle>
            <CardDescription className="text-xs">Sub-system availability status.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             {[
               { label: "Reporting Engine", status: "Active" },
               { label: "Data Isolation", status: "Secure" },
               { label: "Audit Middleware", status: "Online" },
               { label: "Export Service", status: "Standby" },
             ].map((node) => (
               <div key={node.label} className="flex items-center justify-between p-3 bg-white border rounded-sm">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{node.label}</span>
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">{node.status}</span>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
