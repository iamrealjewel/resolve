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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    companyId: "all",
    locationId: "all",
    categoryId: "all",
    priority: "all",
    status: "all",
  });

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = 
      incident.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      incident.title.toLowerCase().includes(search.toLowerCase()) ||
      incident.company.name.toLowerCase().includes(search.toLowerCase()) ||
      incident.reporter.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCompany = filters.companyId === "all" || incident.companyId === filters.companyId;
    const matchesLocation = filters.locationId === "all" || incident.locationId === filters.locationId;
    const matchesCategory = filters.categoryId === "all" || incident.categoryId === filters.categoryId;
    const matchesPriority = filters.priority === "all" || incident.priority === filters.priority;
    const matchesStatus = filters.status === "all" || incident.status === filters.status;
    
    // Closed logic: Hide closed unless showClosed is true OR status filter is explicitly CLOSED/RESOLVED
    const isClosed = incident.status === "CLOSED" || incident.status === "RESOLVED";
    const matchesClosed = showClosed || !isClosed || filters.status === "CLOSED" || filters.status === "RESOLVED";

    // Date range logic
    const incidentDate = new Date(incident.createdAt);
    const matchesStartDate = !dateFilter.start || incidentDate >= new Date(dateFilter.start);
    const matchesEndDate = !dateFilter.end || incidentDate <= new Date(dateFilter.end + "T23:59:59");

    return matchesSearch && matchesCompany && matchesLocation && matchesCategory && matchesPriority && matchesStatus && matchesClosed && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setFilters({
      companyId: "all",
      locationId: "all",
      categoryId: "all",
      priority: "all",
      status: "all",
    });
    setSearch("");
    setShowClosed(false);
    setDateFilter({ start: "", end: "" });
  };

  const hasActiveFilters = 
    search !== "" || 
    showClosed !== false ||
    dateFilter.start !== "" ||
    dateFilter.end !== "" ||
    Object.values(filters).some(v => v !== "all");

  return (
    <div className="space-y-6">
      {/* ADVANCED FILTER PANEL */}
      <div className="bg-white border p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#0176D3]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Operational Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs font-bold text-[#0176D3] hover:bg-blue-50 px-3 uppercase tracking-wider"
            >
              <X className="mr-1.5 size-3.5" /> Reset All
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4">
          {/* SEARCH FIELD */}
          <div className="w-full lg:w-72 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input 
                type="text" 
                placeholder="Ticket ID, Title, User..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-background border rounded-none text-xs font-bold focus:outline-none focus:border-[#0176D3] transition-all placeholder:font-medium"
              />
            </div>
          </div>

          {/* ORGANIZATIONAL SCOPE */}
          <div className="flex items-end gap-3 flex-1 min-w-[300px]">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company</label>
              <Select value={filters.companyId} onValueChange={(v) => setFilters({...filters, companyId: v})}>
                <SelectTrigger className="h-9 w-full bg-background rounded-none border text-xs font-bold focus:ring-0 px-3">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Companies">All Companies</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location</label>
              <Select value={filters.locationId} onValueChange={(v) => setFilters({...filters, locationId: v})}>
                <SelectTrigger className="h-9 w-full bg-background rounded-none border text-xs font-bold focus:ring-0 px-3">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Locations">All Locations</SelectItem>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id} label={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CLASSIFICATION */}
          <div className="flex items-end gap-3 flex-1 min-w-[300px]">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
              <Select value={filters.categoryId} onValueChange={(v) => setFilters({...filters, categoryId: v})}>
                <SelectTrigger className="h-9 w-full bg-background rounded-none border text-xs font-bold focus:ring-0 px-3">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Categories">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority</label>
              <Select value={filters.priority} onValueChange={(v) => setFilters({...filters, priority: v})}>
                <SelectTrigger className="h-9 w-full bg-background rounded-none border text-xs font-bold focus:ring-0 px-3">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Priorities">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_MAP).map(([val, label]) => (
                    <SelectItem key={val} value={val} label={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* STATUS & DATE */}
          <div className="flex items-end gap-3 w-full xl:w-auto xl:flex-1">
            <div className="w-48 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
              <div className="flex gap-2">
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger className="h-9 flex-1 bg-background rounded-none border text-xs font-bold focus:ring-0 px-3">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" label="All Statuses">All Statuses</SelectItem>
                    {Object.entries(STATUS_MAP).map(([val, label]) => (
                      <SelectItem key={val} value={val} label={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className={cn(
                    "flex items-center gap-2 px-3 border transition-all cursor-pointer rounded-none h-9",
                    showClosed ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-background border-input text-muted-foreground"
                  )} 
                  onClick={() => setShowClosed(!showClosed)}
                >
                  <label htmlFor="showClosed" className="text-[9px] font-black uppercase tracking-widest cursor-pointer select-none">Closed</label>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timeline Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 h-9">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50" />
                  <input 
                    type="date" 
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                    className="w-full h-full pl-9 pr-2 bg-background border rounded-none text-[10px] font-bold focus:outline-none focus:border-[#0176D3] transition-all uppercase"
                  />
                </div>
                <div className="text-muted-foreground text-[8px] font-black tracking-tighter">TO</div>
                <div className="relative flex-1 h-9">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50" />
                  <input 
                    type="date" 
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                    className="w-full h-full pl-9 pr-2 bg-background border rounded-none text-[10px] font-bold focus:outline-none focus:border-[#0176D3] transition-all uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border shadow-none rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] font-bold text-muted-foreground text-[10px] uppercase tracking-wider pl-8 h-10">ID</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10">Incident</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10">Reporter</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10">Assignee</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10">Classification</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10 text-center">Docs</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10 text-center">Priority</TableHead>
                <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider h-10">Status</TableHead>
                <TableHead className="w-[80px] h-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <AlertCircle className="size-10 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-sm">No records matching active sifts</p>
                        <p className="text-muted-foreground text-[10px] font-medium">Adjust your filters to reveal hidden incident records</p>
                      </div>
                      <Button onClick={clearFilters} variant="outline" size="sm" className="font-bold rounded-none h-10 px-8 mt-2">
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((incident) => (
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
                      {incident.assignee ? (
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-blue-50 flex items-center justify-center font-bold text-[10px] text-[#0176D3] border border-blue-100">
                            {incident.assignee.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{incident.assignee.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{(incident.assignee.department as any)?.name || "Resolver"}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <div className="size-8 bg-muted/20 border border-dashed flex items-center justify-center font-bold text-[10px] text-muted-foreground/40">
                             ?
                           </div>
                           <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">Unassigned</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{incident.category?.name || "Unclassified"}</span>
                          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{(incident.company as any)?.name}</span>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 rounded-none border border-transparent hover:border-border hover:bg-background transition-all text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/incidents/${incident.id}/edit`;
                          }}
                          title="Edit Incident"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
