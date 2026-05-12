"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Activity,
  ShieldAlert,
  ArrowRight,
  Zap,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Command Center
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Real-time incident intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 font-semibold text-xs px-4">Analytics</Button>
          <Button size="sm" className="h-8 bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-xs px-4">Generate Report</Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {[
          { label: "Total Active", value: "248", icon: Activity, color: "text-[#0176D3]", bg: "bg-blue-50", trend: "+12%" },
          { label: "High Priority", value: "32", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", trend: "-5%" },
          { label: "Avg Response", value: "14m", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: "+2m" },
          { label: "Security Score", value: "98%", icon: ShieldAlert, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Stable" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border shadow-none rounded-sm">
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground">{kpi.label}</span>
              <div className={cn("p-1.5 rounded-sm", kpi.bg)}>
                <kpi.icon className={cn("size-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
                <span className={cn("text-[10px] font-semibold", kpi.trend.includes('+') ? "text-emerald-600" : kpi.trend.includes('-') ? "text-red-600" : "text-muted-foreground")}>
                  {kpi.trend}
                </span>
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">JD</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Incident #TK-4920 Resolved</span>
                      <span className="text-xs text-muted-foreground font-medium">John Doe updated the registry • 12m ago</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ))}
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
                <span>Infrastructure</span>
                <span>94%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#0176D3] rounded-full w-[94%]" />
              </div>
            </div>
            <div className="space-y-2 text-center pt-4">
              <div className="size-20 mx-auto rounded-full border-4 border-blue-100 border-t-[#0176D3] flex items-center justify-center">
                <span className="text-xl font-bold">92</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">OVERALL SCORE</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

