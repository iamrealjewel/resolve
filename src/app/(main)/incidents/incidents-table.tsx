"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Building2,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Paperclip,
  FileIcon,
  Download,
  ShieldAlert
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RelativeTime } from "@/components/relative-time";
import { approveIncident } from "@/app/actions/approvals";
import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IncidentsTableProps {
  incidents: any[];
  companies: any[];
  locations: any[];
  categories: any[];
  activeTab: string;
}

const STATUS_MAP: Record<string, string> = {
  NEW: "Pending",
  PENDING_BUSINESS_APPROVAL: "Pending Business Approval",
  PENDING_OPERATIONAL_APPROVAL: "Pending Operational Approval",
  ASSIGNED: "WIP",
  IN_PROGRESS: "WIP",
  RESOLVED: "Closed",
  CLOSED: "Closed",
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function IncidentsTable({ 
  incidents, 
  companies, 
  locations, 
  categories,
  activeTab 
}: IncidentsTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    companyIds: [] as string[],
    locationIds: [] as string[],
    categoryIds: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[],
  });

  const toggleFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
    setCurrentPage(1);
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = 
      incident.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      incident.title.toLowerCase().includes(search.toLowerCase()) ||
      incident.company.name.toLowerCase().includes(search.toLowerCase()) ||
      incident.reporter.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCompany = filters.companyIds.length === 0 || filters.companyIds.includes(incident.companyId);
    const matchesLocation = filters.locationIds.length === 0 || filters.locationIds.includes(incident.locationId);
    const matchesCategory = filters.categoryIds.length === 0 || filters.categoryIds.includes(incident.categoryId);
    const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(incident.priority);
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(incident.status);
    
    const isClosed = incident.status === "CLOSED" || incident.status === "RESOLVED";
    const matchesClosed = showClosed || !isClosed || filters.statuses.some(s => s === "CLOSED" || s === "RESOLVED");

    const incidentDate = new Date(incident.createdAt);
    const matchesStartDate = !dateFilter.start || incidentDate >= new Date(dateFilter.start);
    const matchesEndDate = !dateFilter.end || incidentDate <= new Date(dateFilter.end + "T23:59:59");

    return matchesSearch && matchesCompany && matchesLocation && matchesCategory && matchesPriority && matchesStatus && matchesClosed && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setFilters({
      companyIds: [],
      locationIds: [],
      categoryIds: [],
      priorities: [],
      statuses: [],
    });
    setSearch("");
    setShowClosed(false);
    setDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    search !== "" || 
    showClosed !== false ||
    dateFilter.start !== "" ||
    dateFilter.end !== "" ||
    Object.values(filters).some(v => v.length > 0);

  return (
    <div className="space-y-6">
      {/* MINIMAL TOP FILTER PANEL */}
      <div className="bg-white border p-6">
        <div className="flex flex-wrap items-end gap-6">
          {/* SEARCH FIELD */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input 
                type="text" 
                placeholder="Search Ticket ID, Title, User or Company..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 pl-10 pr-4 bg-background border rounded-none text-xs font-bold focus:outline-none focus:border-[#0176D3] transition-all placeholder:font-medium placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* DATE RANGE */}
          <div className="w-[450px] flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timeline Discovery</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 h-10">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                <input 
                  type="date" 
                  value={dateFilter.start}
                  onChange={(e) => { setDateFilter({...dateFilter, start: e.target.value}); setCurrentPage(1); }}
                  className="w-full h-full pl-10 pr-2 bg-background border rounded-none text-[10px] font-bold focus:outline-none focus:border-[#0176D3] transition-all uppercase"
                />
              </div>
              <div className="text-muted-foreground text-[8px] font-black tracking-tighter px-1">TO</div>
              <div className="relative flex-1 h-10">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                <input 
                  type="date" 
                  value={dateFilter.end}
                  onChange={(e) => { setDateFilter({...dateFilter, end: e.target.value}); setCurrentPage(1); }}
                  className="w-full h-full pl-10 pr-2 bg-background border rounded-none text-[10px] font-bold focus:outline-none focus:border-[#0176D3] transition-all uppercase"
                />
              </div>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="flex items-center gap-4">
            <div 
              className={cn(
                "flex items-center gap-2.5 px-4 border transition-all cursor-pointer rounded-none h-10",
                showClosed ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-background border-input text-muted-foreground hover:border-[#0176D3]/50"
              )} 
              onClick={() => { setShowClosed(!showClosed); setCurrentPage(1); }}
            >
              <Check className={cn("size-3.5", showClosed ? "opacity-100" : "opacity-20")} />
              <label className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">Show Closed</label>
            </div>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="h-10 text-[10px] font-black text-red-500 hover:bg-red-50 px-4 uppercase tracking-widest rounded-none border-red-100"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="border shadow-none rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] font-bold text-muted-foreground text-[10px] uppercase tracking-wider pl-8 h-12">Ticket ID</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">Incident Title</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">Reporter</TableHead>
                
                {/* ORGANIZATIONAL SCOPE FILTER */}
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors uppercase">
                      Company <Filter className={cn("size-3", filters.companyIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Company</span>
                        {filters.companyIds.length > 0 && (
                          <button onClick={() => setFilters(f => ({...f, companyIds: []}))} className="text-[9px] font-bold text-[#0176D3] hover:underline">Clear</button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {companies.map(c => (
                          <div 
                            key={c.id} 
                            className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleFilter("companyIds", c.id)}
                          >
                            <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.companyIds.includes(c.id) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                              {filters.companyIds.includes(c.id) && <Check className="size-2.5" />}
                            </div>
                            <span className="text-xs font-bold text-foreground">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                {/* CLASSIFICATION FILTER */}
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors uppercase">
                      Classification <Filter className={cn("size-3", filters.categoryIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Category</span>
                        {filters.categoryIds.length > 0 && (
                          <button onClick={() => setFilters(f => ({...f, categoryIds: []}))} className="text-[9px] font-bold text-[#0176D3] hover:underline">Clear</button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {categories.map(c => (
                          <div 
                            key={c.id} 
                            className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleFilter("categoryIds", c.id)}
                          >
                            <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.categoryIds.includes(c.id) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                              {filters.categoryIds.includes(c.id) && <Check className="size-2.5" />}
                            </div>
                            <span className="text-xs font-bold text-foreground">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12 text-center">Docs</TableHead>
                
                {/* PRIORITY FILTER */}
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors mx-auto uppercase">
                      Priority <Filter className={cn("size-3", filters.priorities.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="center">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</span>
                      </div>
                      <div className="p-2">
                        {Object.entries(PRIORITY_MAP).map(([val, label]) => (
                          <div 
                            key={val} 
                            className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleFilter("priorities", val)}
                          >
                            <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.priorities.includes(val) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                              {filters.priorities.includes(val) && <Check className="size-2.5" />}
                            </div>
                            <span className="text-xs font-bold text-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                {/* STATUS FILTER */}
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors uppercase">
                      Status <Filter className={cn("size-3", filters.statuses.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current State</span>
                      </div>
                      <div className="p-2">
                        {Object.entries(STATUS_MAP).map(([val, label]) => (
                          <div 
                            key={val} 
                            className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleFilter("statuses", val)}
                          >
                            <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.statuses.includes(val) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                              {filters.statuses.includes(val) && <Check className="size-2.5" />}
                            </div>
                            <span className="text-xs font-bold text-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead className="w-[80px] h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIncidents.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <AlertCircle className="size-10 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-sm">No records found</p>
                        <p className="text-muted-foreground text-[10px] font-medium">Try clearing your filters or search terms</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedIncidents.map((incident) => (
                  <TableRow key={incident.id} className="group hover:bg-muted/20 transition-all border-b last:border-0 cursor-pointer" onClick={() => window.location.href = `/incidents/${incident.id}`}>
                    <TableCell className="pl-8 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-[#0176D3]">
                          {incident.ticketId}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          <RelativeTime date={incident.createdAt} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground group-hover:text-[#0176D3] transition-colors line-clamp-1">
                          {incident.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {incident.category?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground border">
                          {incident.reporter?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{incident.reporter?.name || "Unknown"}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{(incident.reporter?.department as any)?.name || "Dept"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{(incident.company as any)?.name}</span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{(incident.location as any)?.name || "Site"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{incident.category?.name || "Unclassified"}</span>
                          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Dept: {(incident.department as any)?.name}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                       {incident.attachments?.length > 0 ? (
                         <div onClick={(e) => e.stopPropagation()}>
                           <Popover>
                              <PopoverTrigger 
                                className="h-8 px-2 gap-2 hover:bg-primary/10 group flex items-center justify-center rounded-md transition-colors border-none bg-transparent cursor-pointer"
                              >
                                 <Paperclip className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                 <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary">{incident.attachments.length}</span>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-xl" align="center">
                                 <div className="p-3 border-b bg-muted/30">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Evidence Registry</span>
                                 </div>
                                 <div className="max-h-64 overflow-y-auto">
                                    {incident.attachments.map((f: any, i: number) => (
                                      <div key={i} className="p-3 border-b last:border-0 hover:bg-muted/10 flex items-center justify-between group">
                                         <div className="flex items-center gap-3 min-w-0">
                                            <FileIcon className="size-3.5 text-muted-foreground" />
                                            <span className="text-[10px] font-bold text-foreground truncate">{f.name}</span>
                                         </div>
                                         <a 
                                           href={f.url} 
                                           download={f.name}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="size-7 bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary transition-colors border border-primary/20"
                                           onClick={(e) => e.stopPropagation()}
                                         >
                                            <Download className="size-3" />
                                         </a>
                                      </div>
                                    ))}
                                 </div>
                              </PopoverContent>
                           </Popover>
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-muted-foreground/20">-</span>
                       )}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-semibold text-[10px] rounded-sm px-2 py-0 border",
                          incident.priority === "CRITICAL" && "border-red-200 text-red-700 bg-red-50",
                          incident.priority === "HIGH" && "border-orange-200 text-orange-700 bg-orange-50",
                          incident.priority === "MEDIUM" && "border-amber-200 text-amber-700 bg-amber-50",
                          incident.priority === "LOW" && "border-blue-200 text-blue-700 bg-blue-50"
                        )}
                      >
                        {PRIORITY_MAP[incident.priority] || incident.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "size-2 rounded-full",
                          incident.status === "RESOLVED" || incident.status === "CLOSED" ? "bg-slate-400" : 
                          incident.status.includes("PENDING") ? "bg-amber-500" : "bg-blue-500"
                        )} />
                        <span className="text-xs font-semibold text-foreground">
                          {STATUS_MAP[incident.status] || incident.status.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-8 text-right py-5">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "pending" && (
                          (incident.raiserApproverId === user?.id && incident.status === "PENDING_BUSINESS_APPROVAL") ||
                          (incident.resolverApproverId === user?.id && incident.status === "PENDING_OPERATIONAL_APPROVAL") ||
                          (incident.category?.approvers?.some((a: any) => a.userId === user?.id && 
                            ((a.type === "RAISER" && incident.status === "PENDING_BUSINESS_APPROVAL") || 
                             (a.type === "RESOLVER" && incident.status === "PENDING_OPERATIONAL_APPROVAL")))) ||
                          (user?.role === "SUPER_ADMIN") ||
                          (user?.role === "DEPARTMENT_HEAD" && incident.departmentId === user?.departmentId)
                        ) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-none border-[#0176D3] text-[#0176D3] hover:bg-[#0176D3] hover:text-white transition-all font-bold text-[10px] px-3 gap-1.5"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const type = incident.status === "PENDING_BUSINESS_APPROVAL" ? "BUSINESS" : "OPERATIONAL";
                                await approveIncident(incident.id, type);
                                toast.success("Incident Approved");
                                router.refresh();
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }}
                          >
                            <Check className="size-3" /> Approve
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 rounded-none border border-transparent hover:border-border hover:bg-background transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/incidents/${incident.id}`;
                          }}
                          title="View Incident"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {Math.min(filteredIncidents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredIncidents.length, currentPage * itemsPerPage)} of {filteredIncidents.length}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 px-3 rounded-none text-[10px] font-bold uppercase tracking-wider disabled:opacity-30"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-none text-[10px] font-bold transition-all",
                    currentPage === i + 1 ? "bg-[#0176D3] text-white border-[#0176D3]" : "hover:border-[#0176D3] hover:text-[#0176D3]"
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 px-3 rounded-none text-[10px] font-bold uppercase tracking-wider disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
