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
  CheckCircle,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [filters, setFilters] = React.useState<{ actions: string[], userIds: string[] }>({ actions: [], userIds: [] });
  const [dateFilter, setDateFilter] = React.useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  const filteredLogs = React.useMemo(() => {
    return initialLogs.filter(log => {
      const matchesSearch = 
        log.incident.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        log.content.toLowerCase().includes(search.toLowerCase()) ||
        log.user.name.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = filters.actions.length === 0 || filters.actions.includes(log.action);
      const matchesUser = filters.userIds.length === 0 || filters.userIds.includes(log.userId);

      let matchesDate = true;
      if (dateFilter.start) {
        matchesDate = matchesDate && new Date(log.createdAt) >= new Date(dateFilter.start);
      }
      if (dateFilter.end) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(log.createdAt) <= endDate;
      }

      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });
  }, [initialLogs, search, filters, dateFilter]);

  const actions = Array.from(new Set(initialLogs.map(l => l.action)));

  const toggleFilter = (type: "actions" | "userIds", value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ actions: [], userIds: [] });
    setSearch("");
    setDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = search !== "" || dateFilter.start !== "" || dateFilter.end !== "" || Object.values(filters).some(v => v.length > 0);

  return (
    <div className="">
      {/* MINIMAL TOP FILTERS - NO CONTAINER */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-1">
        <div className="flex flex-wrap items-center gap-6 mb-2 mt-6">
          {/* SEARCH FIELD */}
          <div className="w-80 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Live Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search ticket, title or user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 pl-9 pr-4 bg-background border rounded-none text-xs font-medium focus:outline-none focus:border-[#0176D3] transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          {/* DATE RANGE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <div className="flex items-center gap-2 h-9">
              <div className="relative w-40 h-full">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => { setDateFilter({ ...dateFilter, start: e.target.value }); setCurrentPage(1); }}
                  className="w-full h-full pl-9 pr-2 bg-background border rounded-none text-xs font-medium focus:outline-none focus:border-[#0176D3] transition-all"
                />
              </div>
              <span className="text-muted-foreground text-xs">-</span>
              <div className="relative w-40 h-full">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                <input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => { setDateFilter({ ...dateFilter, end: e.target.value }); setCurrentPage(1); }}
                  className="w-full h-full pl-9 pr-2 bg-background border rounded-none text-xs font-medium focus:outline-none focus:border-[#0176D3] transition-all"
                />
              </div>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex bg-muted/30 p-1 rounded-md border h-9 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-full px-3 gap-2 text-xs font-medium">
                    <Filter className="size-3.5" />
                    Action Types
                    {filters.actions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] bg-[#0176D3] text-white">
                        {filters.actions.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0 rounded-none border-muted-foreground/20 shadow-xl" align="start">
                  <div className="p-3 border-b bg-muted/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action Filter</span>
                  </div>
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {actions.map((action: any) => (
                      <div
                        key={action}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleFilter("actions", action)}
                      >
                        <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.actions.includes(action) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                          {filters.actions.includes(action) && <Check className="size-2.5" />}
                        </div>
                        <span className="text-xs font-bold text-foreground">{action.replace("_", " ")}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="w-[1px] h-4 bg-border mx-1" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-full px-3 gap-2 text-xs font-medium">
                    <UserIcon className="size-3.5" />
                    Users
                    {filters.userIds.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] bg-[#0176D3] text-white">
                        {filters.userIds.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-xl" align="start">
                  <div className="p-3 border-b bg-muted/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User Filter</span>
                  </div>
                  <div className="p-2 max-h-[300px] overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleFilter("userIds", u.id)}
                      >
                        <div className={cn("size-3.5 border flex items-center justify-center shrink-0 transition-all", filters.userIds.includes(u.id) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                          {filters.userIds.includes(u.id) && <Check className="size-2.5" />}
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-red-500"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/40 my-4" />

      {/* TABLE */}
      <div className="bg-white border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border/50">
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground w-[160px]">Timestamp</TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground w-[130px]">Ticket ID</TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground w-[150px]">Action</TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground w-[180px]">Performed By</TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground">Details</TableHead>
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground w-[60px] text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground bg-slate-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <History className="size-6 text-muted-foreground/30" />
                      <span className="text-sm font-medium">No audit logs found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentLogs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || Activity;
                  return (
                    <TableRow 
                      key={log.id} 
                      className="group hover:bg-[#F3F9FF] border-b border-border/40 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-3 px-4 w-[160px]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground">
                            {format(new Date(log.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {format(new Date(log.createdAt), "HH:mm:ss a")}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-3 px-4 w-[130px]">
                        <Link href={`/incidents/${log.incidentId}`} className="text-xs font-bold text-[#0176D3] hover:underline">
                          {log.incident.ticketId}
                        </Link>
                      </TableCell>

                      <TableCell className="py-3 px-4 w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-sm shrink-0", ACTION_COLORS[log.action] || "bg-muted text-muted-foreground")}>
                            <Icon className="size-3" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                            {log.action.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4 w-[180px]">
                        <span className="text-xs font-medium text-foreground truncate">{log.user.name}</span>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div 
                          className="text-xs text-muted-foreground font-medium line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: log.content }}
                        />
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right w-[60px]">
                        <Link href={`/incidents/${log.incidentId}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#0176D3]">
                            <ArrowRight className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 w-7 p-0 text-[10px] font-bold",
                          currentPage === page ? "bg-[#0176D3] hover:bg-[#0176D3]/90" : ""
                        )}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return <MoreHorizontal key={page} className="size-3.5 text-muted-foreground mx-1" />;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
