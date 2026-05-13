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
  ShieldAlert,
  ShieldCheck,
  Check
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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface IncidentsTableProps {
  incidents: any[];
  companies: any[];
  locations: any[];
  categories: any[];
  departments: any[];
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

const FILTER_STATUSES = [
  { label: "Pending", values: ["NEW"] },
  { label: "Pending Business Approval", values: ["PENDING_BUSINESS_APPROVAL"] },
  { label: "Pending Operational Approval", values: ["PENDING_OPERATIONAL_APPROVAL"] },
  { label: "WIP", values: ["ASSIGNED", "IN_PROGRESS"] },
  { label: "Closed", values: ["RESOLVED", "CLOSED"] },
];

const PRIORITY_MAP: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
  return categories
    .filter(c => (c.parentId ?? null) === parentId)
    .map(c => ({ ...c, children: buildCategoryTree(categories, c.id) }));
}

function getAllDescendantIds(node: any): string[] {
  return [node.id, ...(node.children?.flatMap(getAllDescendantIds) ?? [])];
}

function CategoryFilterNode({
  node,
  depth = 0,
  selectedIds,
  onSelect,
  onDeselect,
}: {
  node: any;
  depth?: number;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDeselect: (ids: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const allIds = getAllDescendantIds(node);
  const selectedCount = allIds.filter(id => selectedIds.includes(id)).length;
  const isSelected = selectedIds.includes(node.id);
  const isPartial = !isSelected && selectedCount > 0;

  const handleToggle = () => {
    if (isSelected || isPartial) {
      onDeselect(allIds);
    } else {
      onSelect(allIds);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 pr-2 hover:bg-muted/50 cursor-pointer rounded-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronRight className={cn("size-3 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <div className="size-4 shrink-0" />
        )}
        <div
          className="flex items-center gap-2 flex-1"
          onClick={handleToggle}
        >
          <div className={cn(
            "size-3.5 border flex items-center justify-center transition-all shrink-0",
            isSelected ? "bg-[#0176D3] border-[#0176D3] text-white" :
            isPartial ? "bg-[#0176D3]/20 border-[#0176D3]/50 text-[#0176D3]" :
            "bg-white border-muted-foreground/30"
          )}>
            {isSelected && <Check className="size-2.5" />}
            {isPartial && <div className="w-2 h-0.5 bg-[#0176D3] rounded-full" />}
          </div>
          <span className={cn(
            "text-xs truncate",
            depth === 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"
          )}>{node.name}</span>
          {isPartial && (
            <span className="text-[9px] text-[#0176D3] font-bold ml-auto shrink-0">{selectedCount}</span>
          )}
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child: any) => (
            <CategoryFilterNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onDeselect={onDeselect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function IncidentsTable({
  incidents,
  companies,
  locations,
  categories,
  departments,
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
  const [reporterSearch, setReporterSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    companyIds: [] as string[],
    locationIds: [] as string[],
    categoryIds: [] as string[],
    priorities: [] as string[],
    statuses: [] as string[],
    reporterIds: [] as string[],
    assigneeIds: [] as string[],
  });

  const uniqueReporters = Array.from(new Map(incidents.map(i => [i.reporter?.id, i.reporter] as [string, any]).filter(([id]) => !!id)).values());
  const uniqueAssignees = Array.from(new Map(incidents.map(i => [i.assignee?.id, i.assignee] as [string, any]).filter(([id]) => !!id)).values());

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
    const matchesReporter = filters.reporterIds.length === 0 || filters.reporterIds.includes(incident.reporterId);
    const matchesAssignee = filters.assigneeIds.length === 0 || (incident.assigneeId && filters.assigneeIds.includes(incident.assigneeId));

    const isClosed = incident.status === "CLOSED" || incident.status === "RESOLVED";
    const matchesClosed = showClosed || !isClosed || filters.statuses.some(s => s === "CLOSED" || s === "RESOLVED");

    const incidentDate = new Date(incident.createdAt);
    const matchesStartDate = !dateFilter.start || incidentDate >= new Date(dateFilter.start);
    const matchesEndDate = !dateFilter.end || incidentDate <= new Date(dateFilter.end + "T23:59:59");

    return matchesSearch && matchesCompany && matchesLocation && matchesCategory && matchesPriority && matchesStatus && matchesClosed && matchesStartDate && matchesEndDate && matchesReporter && matchesAssignee;
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
      reporterIds: [],
      assigneeIds: [],
    });
    setSearch("");
    setShowClosed(false);
    setDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const getCategoryBreadcrumb = (id: string) => {
    const path: string[] = [];
    let current = categories.find(c => c.id === id);
    while (current && current.parentId) {
      const parent = categories.find(c => c.id === current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return path.join(" / ");
  };

  const getTopLevelDepartment = (id: string) => {
    let current = departments?.find(d => d.id === id);
    while (current && current.parentId) {
      const parent = departments.find(d => d.id === current.parentId);
      if (parent) {
        current = parent;
      } else {
        break;
      }
    }
    return current?.name || "N/A";
  };

  const hasActiveFilters =
    search !== "" ||
    showClosed !== false ||
    dateFilter.start !== "" ||
    dateFilter.end !== "" ||
    Object.values(filters).some(v => v.length > 0);

  return (
    <div className="">
      {/* MINIMAL TOP FILTERS - NO CONTAINER */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-1">
        <div className="flex flex-wrap items-center gap-6  mb-2">
          {/* SEARCH FIELD - REDUCED WIDTH */}
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
            <div
              className={cn(
                "flex items-center gap-2 px-3 border transition-all cursor-pointer rounded-none h-9",
                showClosed ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-background border-input text-muted-foreground hover:border-[#0176D3]/50"
              )}
              onClick={() => { setShowClosed(!showClosed); setCurrentPage(1); }}
            >
              <Check className={cn("size-3", showClosed ? "opacity-100" : "opacity-20")} />
              <span className="text-[10px] font-bold uppercase tracking-wider select-none">Closed</span>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 uppercase tracking-wider"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="border shadow-none rounded-none overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#F8FAFC] border-y border-muted-foreground/10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[110px] font-semibold text-foreground text-xs pl-8 h-12">Date</TableHead>
                <TableHead className="w-[250px] font-semibold text-foreground text-xs h-12">Incident Details</TableHead>

                {/* REPORTER FILTER */}
                <TableHead className="w-[160px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors font-semibold">
                      Reporter <Filter className={cn("size-3", filters.reporterIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Reporter</span>
                      </div>
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
                          <input
                            type="text"
                            placeholder="Filter reporters..."
                            value={reporterSearch}
                            onChange={(e) => setReporterSearch(e.target.value)}
                            className="w-full h-8 pl-8 pr-2 bg-muted/20 border-none text-[10px] font-bold focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {uniqueReporters
                          .filter((u: any) => u.name.toLowerCase().includes(reporterSearch.toLowerCase()))
                          .map((u: any) => (
                            <div
                              key={u.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleFilter("reporterIds", u.id)}
                            >
                              <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.reporterIds.includes(u.id) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                                {filters.reporterIds.includes(u.id) && <Check className="size-2.5" />}
                              </div>
                              <span className="text-xs font-bold text-foreground">{u.name}</span>
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                {/* ASSIGNEE FILTER */}
                <TableHead className="w-[160px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors font-semibold">
                      Assignee <Filter className={cn("size-3", filters.assigneeIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Assignee</span>
                      </div>
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
                          <input
                            type="text"
                            placeholder="Filter assignees..."
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            className="w-full h-8 pl-8 pr-2 bg-muted/20 border-none text-[10px] font-bold focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {uniqueAssignees
                          .filter((u: any) => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                          .map((u: any) => (
                            <div
                              key={u.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleFilter("assigneeIds", u.id)}
                            >
                              <div className={cn("size-3.5 border flex items-center justify-center transition-all", filters.assigneeIds.includes(u.id) ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                                {filters.assigneeIds.includes(u.id) && <Check className="size-2.5" />}
                              </div>
                              <span className="text-xs font-bold text-foreground">{u.name}</span>
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                {/* ORGANIZATIONAL SCOPE FILTER */}
                <TableHead className="w-[130px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors font-medium">
                      Company <Filter className={cn("size-3", filters.companyIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Company</span>
                        {filters.companyIds.length > 0 && (
                          <button onClick={() => setFilters(f => ({ ...f, companyIds: [] }))} className="text-[9px] font-bold text-[#0176D3] hover:underline">Clear</button>
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
                <TableHead className="w-[180px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors font-medium">
                      Classification <Filter className={cn("size-3", filters.categoryIds.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Category</span>
                        {filters.categoryIds.length > 0 && (
                          <button onClick={() => setFilters(f => ({ ...f, categoryIds: [] }))} className="text-[9px] font-bold text-[#0176D3] hover:underline">Clear</button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {buildCategoryTree(categories).map(root => (
                          <CategoryFilterNode
                            key={root.id}
                            node={root}
                            selectedIds={filters.categoryIds}
                            onSelect={(ids) => setFilters(f => ({ ...f, categoryIds: [...new Set([...f.categoryIds, ...ids])] }))}
                            onDeselect={(ids) => setFilters(f => ({ ...f, categoryIds: f.categoryIds.filter(id => !ids.includes(id)) }))}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                <TableHead className="w-[50px] font-semibold text-foreground text-xs h-12 text-center">Docs</TableHead>

                {/* PRIORITY FILTER */}
                <TableHead className="w-[90px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors mx-auto font-medium">
                      Priority <Filter className={cn("size-3", filters.priorities.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="center">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</span>
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
                            <span className="text-xs font-medium text-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>

                {/* STATUS FILTER */}
                <TableHead className="w-[110px] font-semibold text-foreground text-xs h-12">
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 hover:text-[#0176D3] transition-colors font-medium">
                      Status <Filter className={cn("size-3", filters.statuses.length > 0 && "text-[#0176D3] fill-[#0176D3]")} />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
                      <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current State</span>
                      </div>
                      <div className="p-2">
                        {FILTER_STATUSES.map(({ label, values }) => {
                          const isSelected = values.every(v => filters.statuses.includes(v));
                          return (
                            <div
                              key={label}
                              className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                              onClick={() => {
                                setFilters(prev => {
                                  if (isSelected) {
                                    return { ...prev, statuses: prev.statuses.filter(s => !values.includes(s)) };
                                  } else {
                                    return { ...prev, statuses: [...new Set([...prev.statuses, ...values])] };
                                  }
                                });
                              }}
                            >
                              <div className={cn("size-3.5 border flex items-center justify-center transition-all", isSelected ? "bg-[#0176D3] border-[#0176D3] text-white" : "bg-white border-muted-foreground/30")}>
                                {isSelected && <Check className="size-2.5" />}
                              </div>
                              <span className="text-xs font-bold text-foreground">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead className="w-[100px] h-12 text-right pr-8 font-semibold text-foreground text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIncidents.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="h-64 text-center">
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
                paginatedIncidents.map((incident) => {
                  const lastStatusLog = incident.logs?.find((l: any) => l.action === "STATUS_CHANGE");
                  const lastChangeDate = lastStatusLog ? new Date(lastStatusLog.createdAt) : new Date(incident.createdAt);

                  return (
                    <TableRow
                      key={incident.id}
                      className="group hover:bg-[#F8FAFC] transition-all border-b last:border-0 cursor-pointer"
                      onClick={() => window.location.href = `/incidents/${incident.id}`}
                    >
                      <TableCell className="pl-8 py-3 w-[110px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-foreground">
                            {format(new Date(incident.createdAt), "dd MMM yyyy")}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-normal">
                            {incident.ticketId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 w-[250px]">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[13px] text-foreground group-hover:text-[#0176D3] transition-colors line-clamp-1">
                            {incident.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                            {stripHtml(incident.description)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 w-[160px]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">{incident.reporter?.name || "Unknown"}</span>
                          {incident.reporter && (
                            <div className="flex flex-col text-[9px] font-normal text-muted-foreground mt-0.5 leading-tight">
                              <span className="truncate" title={`${incident.reporter.designation?.title || 'N/A'}, ${incident.reporter.departmentId ? getTopLevelDepartment(incident.reporter.departmentId) : 'N/A'}`}>
                                {incident.reporter.designation?.title || "N/A"}, {incident.reporter.departmentId ? getTopLevelDepartment(incident.reporter.departmentId) : "N/A"}
                              </span>
                              <span className="truncate text-[#0176D3]/70 font-medium mt-0.5">
                                {(incident.location as any)?.name || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 w-[160px]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">{incident.assignee?.name || "Pending"}</span>
                          {incident.assignee && (
                            <div className="flex flex-col text-[9px] font-normal text-muted-foreground mt-0.5 leading-tight">
                              <span className="truncate" title={`${incident.assignee.designation?.title || 'N/A'}, ${incident.assignee.departmentId ? getTopLevelDepartment(incident.assignee.departmentId) : 'N/A'}`}>
                                {incident.assignee.designation?.title || "N/A"}, {incident.assignee.departmentId ? getTopLevelDepartment(incident.assignee.departmentId) : "N/A"}
                              </span>
                              <span className="truncate text-[#0176D3]/70 font-medium mt-0.5">
                                {(incident.location as any)?.name || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 w-[130px]">
                        <span className="text-xs font-medium text-foreground truncate">{(incident.company as any)?.name}</span>
                      </TableCell>
                      <TableCell className="py-3 w-[180px]">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">{incident.category?.name || "Unclassified"}</span>
                          {incident.categoryId && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-[9px] font-bold py-0 h-4 px-1.5 uppercase tracking-tight bg-indigo-50 text-indigo-700 border-indigo-200 truncate max-w-full inline-block align-top">
                                {getCategoryBreadcrumb(incident.categoryId)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center w-[50px]">
                        {incident.attachments?.length > 0 ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Popover>
                              <PopoverTrigger
                                className="h-8 px-1 gap-1 hover:bg-primary/10 group flex items-center justify-center rounded-md transition-colors border-none bg-transparent cursor-pointer mx-auto"
                              >
                                <Paperclip className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-[9px] font-bold text-muted-foreground group-hover:text-primary">{incident.attachments.length}</span>
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
                      <TableCell className="py-3 text-center w-[100px]">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium text-[9px] rounded-sm px-1.5 py-0 border",
                            incident.priority === "CRITICAL" && "border-red-200 text-red-700 bg-red-50",
                            incident.priority === "HIGH" && "border-orange-200 text-orange-700 bg-orange-50",
                            incident.priority === "MEDIUM" && "border-amber-200 text-amber-700 bg-amber-50",
                            incident.priority === "LOW" && "border-blue-200 text-blue-700 bg-blue-50"
                          )}
                        >
                          {PRIORITY_MAP[incident.priority] || incident.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 w-[110px]">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "size-1.5 rounded-full",
                              incident.status === "RESOLVED" || incident.status === "CLOSED" ? "bg-slate-400" :
                                incident.status.includes("PENDING") ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <span className="text-[11px] font-medium text-foreground truncate">
                              {STATUS_MAP[incident.status] || incident.status.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 font-normal">
                            Changed {format(lastChangeDate, "dd MMM yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right py-3 w-[100px]">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeTab === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 rounded-none text-[9px] font-bold uppercase tracking-wider border border-transparent hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-muted-foreground transition-all"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const type = incident.status === "PENDING_BUSINESS_APPROVAL" ? "BUSINESS" : "OPERATIONAL";
                                  await approveIncident(incident.id, type);
                                  toast.success("Incident approved");
                                  router.refresh();
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to approve");
                                }
                              }}
                            >
                              <ShieldCheck className="size-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-none border border-transparent hover:border-border hover:bg-background transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/incidents/${incident.id}`;
                            }}
                          >
                            <Eye className="size-3 text-muted-foreground hover:text-[#0176D3]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-none border border-transparent hover:border-border hover:bg-background transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/incidents/${incident.id}/edit`;
                            }}
                          >
                            <Edit className="size-3 text-muted-foreground hover:text-[#0176D3]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-3 border-t bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {Math.min(filteredIncidents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredIncidents.length, currentPage * itemsPerPage)} of {filteredIncidents.length}
            </span>
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Per Page</span>
              <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val || "10")); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-[10px] font-bold rounded-none bg-transparent border-muted-foreground/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="h-7 px-2 rounded-none text-[9px] font-bold uppercase tracking-wider disabled:opacity-30"
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "h-7 w-7 rounded-none text-[9px] font-bold transition-all",
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
              className="h-7 px-2 rounded-none text-[9px] font-bold uppercase tracking-wider disabled:opacity-30"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
