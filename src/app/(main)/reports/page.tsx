import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, PieChart, Download, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkAuth } from "@/lib/auth-utils";

async function getReportData() {
  const [totalIncidents, resolvedIncidents, criticalIncidents] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { status: "RESOLVED" } }),
    prisma.incident.count({ where: { priority: "CRITICAL" } }),
  ]);

  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { incidents: true } }
    }
  });

  return { totalIncidents, resolvedIncidents, criticalIncidents, companies };
}

export default async function ReportsPage() {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER"]);
  const data = await getReportData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Analytics Hub</h2>
          <p className="text-muted-foreground font-medium">
            System-wide performance metrics and organizational trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold">
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button size="sm" className="font-bold px-6">
            <FileText className="mr-2 size-4" /> Generate Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Efficiency Rate", value: `${data.totalIncidents > 0 ? ((data.resolvedIncidents / data.totalIncidents) * 100).toFixed(1) : "0"}%`, icon: TrendingUp, color: "text-emerald-500" },
          { label: "System Pressure", value: data.criticalIncidents, icon: Activity, color: "text-red-500" },
          { label: "Total Lifecycle", value: data.totalIncidents, icon: BarChart3, color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i} className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={cn("size-4", kpi.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-foreground">{kpi.value}</div>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Real-time aggregate</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold">Organizational Load</CardTitle>
            <CardDescription className="text-sm">Incident distribution across group entities.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {data.companies.map((company) => (
               <div key={company.id} className="space-y-2">
                 <div className="flex items-center justify-between text-xs font-bold">
                   <span className="text-muted-foreground">{company.name}</span>
                   <span className="text-foreground">{company._count.incidents} Tickets</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${data.totalIncidents > 0 ? (company._count.incidents / data.totalIncidents) * 100 : 0}%` }}
                    />
                 </div>
               </div>
            ))}
            {data.companies.length === 0 && (
              <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm">
                No organizational data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border bg-muted/10">
          <CardHeader className="p-6 pb-2 border-b">
            <CardTitle className="text-lg font-bold">System Status</CardTitle>
            <CardDescription className="text-sm">Infrastructure health diagnostic.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             {[
               { label: "Database Engine", status: "Operational" },
               { label: "Auth Middleware", status: "Synced" },
               { label: "ORM Integration", status: "Active" },
               { label: "Storage Node", status: "Online" },
             ].map((node) => (
               <div key={node.label} className="flex items-center justify-between p-3 bg-background border">
                 <span className="text-xs font-bold text-muted-foreground">{node.label}</span>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{node.status}</span>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
