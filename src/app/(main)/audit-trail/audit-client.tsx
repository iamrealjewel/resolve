"use client";

import React from "react";
import { 
  Search, 
  Calendar, 
  User as UserIcon, 
  Filter, 
  ArrowRight,
  Download,
  History,
  Activity,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  CheckCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

const ACTION_ICONS: Record<string, any> = {
  CREATE: Activity,
  COMMENT: MessageSquare,
  STATUS_CHANGE: AlertTriangle,
  ASSIGNMENT: UserPlus,
  DETAIL_UPDATE: History,
  RESOLUTION: CheckCircle,
  REJECTION: AlertTriangle,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-blue-500 bg-blue-50",
  COMMENT: "text-emerald-500 bg-emerald-50",
  STATUS_CHANGE: "text-amber-500 bg-amber-50",
  ASSIGNMENT: "text-purple-500 bg-purple-50",
  DETAIL_UPDATE: "text-slate-500 bg-slate-50",
  RESOLUTION: "text-emerald-600 bg-emerald-100",
  REJECTION: "text-red-600 bg-red-100",
};

interface AuditClientProps {
  logs: any[];
  users: any[];
}

export default function AuditClient({ logs: initialLogs, users }: AuditClientProps) {
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [userFilter, setUserFilter] = React.useState("ALL");

  const filteredLogs = React.useMemo(() => {
    return initialLogs.filter(log => {
      const matchesSearch = 
        log.incident.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        log.content.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchesUser = userFilter === "ALL" || log.userId === userFilter;

      return matchesSearch && matchesAction && matchesUser;
    });
  }, [initialLogs, search, actionFilter, userFilter]);

  const actions = Array.from(new Set(initialLogs.map(l => l.action)));

  return (
    <div className="flex flex-col h-full bg-[#F3F2F2] dark:bg-black/40">
      {/* HEADER & FILTERS */}
      <div className="bg-white dark:bg-[#1A1A1A] border-b p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <History className="size-5 text-[#0176D3]" />
              System Audit Trail
            </h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              Comprehensive log of all operational activities
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-9 font-bold text-[10px] uppercase tracking-widest gap-2">
            <Download className="size-3.5" /> Export Logs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Ticket ID or Content..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 text-sm rounded-none border-muted/50 focus:ring-1 focus:ring-[#0176D3]"
            />
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-wider rounded-none border-muted/50">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5" />
                <SelectValue placeholder="Action Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold" label="ALL ACTIONS">ALL ACTIONS</SelectItem>
              {actions.map(a => (
                <SelectItem key={a} value={a} className="text-xs font-bold uppercase" label={a.replace("_", " ")}>{a.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-wider rounded-none border-muted/50">
              <div className="flex items-center gap-2">
                <UserIcon className="size-3.5" />
                <SelectValue placeholder="Performed By" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold" label="ALL USERS">ALL USERS</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id} className="text-xs font-bold uppercase" label={u.name}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {filteredLogs.map((log) => {
            const Icon = ACTION_ICONS[log.action] || Activity;
            return (
              <Card key={log.id} className="border shadow-none rounded-none bg-white dark:bg-[#1A1A1A] hover:border-[#0176D3]/30 transition-colors group">
                <div className="p-4 flex items-start gap-4">
                  <div className={cn("p-2 rounded-sm shrink-0 mt-1", ACTION_COLORS[log.action] || "bg-muted")}>
                    <Icon className="size-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.user.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">•</span>
                        <Badge variant="outline" className="h-4 text-[9px] font-black rounded-none uppercase border-[#0176D3]/20 text-[#0176D3]">
                          {log.action.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                          {format(new Date(log.createdAt), "MMM d, yyyy • HH:mm:ss")}
                        </span>
                        <Link href={`/incidents/${log.incidentId}`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/incidents/${log.incidentId}`} className="text-[10px] font-black text-[#0176D3] hover:underline uppercase tracking-tighter">
                        {log.incident.ticketId}
                      </Link>
                      <span className="text-muted-foreground/30">|</span>
                      <div 
                        className="text-xs text-foreground font-medium line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: log.content }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-20 text-center space-y-4 bg-white/50 border border-dashed rounded-none">
              <History className="size-12 text-muted-foreground/20 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No activity matching filters</p>
                <p className="text-xs text-muted-foreground/70">Try adjusting your search or filters to see more results.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
