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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  Shield, 
  MapPin, 
  Building2,
  Phone,
  UserCircle2,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProvisioningDialog, EditUserDialog } from "@/components/user-form";
import { DeleteUserButton } from "@/components/user-crud";
import { cn } from "@/lib/utils";

interface UsersTableProps {
  users: any[];
  companies: any[];
  departments: any[];
  locations: any[];
  designations: any[];
}

const ROLE_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DEPARTMENT_HEAD: "Dept Head",
  LINE_MANAGER: "Manager",
  RESOLVER: "Resolver",
  USER: "Standard User",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  DEPARTMENT_HEAD: "bg-blue-100 text-blue-700 border-blue-200",
  LINE_MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
  RESOLVER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  USER: "bg-slate-100 text-slate-700 border-slate-200",
};

export function UsersTable({ 
  users, 
  companies, 
  departments, 
  locations, 
  designations 
}: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    companyId: "all",
    departmentId: "all",
    locationId: "all",
    designationId: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesCompany = filters.companyId === "all" || user.companyId === filters.companyId;
    const matchesDepartment = filters.departmentId === "all" || user.departmentId === filters.departmentId;
    const matchesLocation = filters.locationId === "all" || user.locationId === filters.locationId;
    const matchesDesignation = filters.designationId === "all" || user.designationId === filters.designationId;

    return matchesSearch && matchesRole && matchesCompany && matchesDepartment && matchesLocation && matchesDesignation;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.role === "SUPER_ADMIN" && b.role !== "SUPER_ADMIN") return -1;
    if (a.role !== "SUPER_ADMIN" && b.role === "SUPER_ADMIN") return 1;
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setFilters({
      role: "all",
      companyId: "all",
      departmentId: "all",
      locationId: "all",
      designationId: "all",
    });
    setSearch("");
  };

  const hasActiveFilters = 
    search !== "" || 
    Object.values(filters).some(v => v !== "all");

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-muted-foreground/10 shadow-none p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="absolute -top-12 right-0 h-8 text-[10px] font-bold uppercase tracking-wider text-[#0176D3] hover:text-white hover:bg-[#0176D3] rounded-sm border-[#0176D3]/20 transition-all px-4"
            >
              <X className="mr-2 size-3" /> Reset
            </Button>
          )}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Live Search</label>
            <div className="h-10 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-[#0176D3] transition-colors" />
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full pl-10 pr-4 bg-muted/5 border rounded-sm text-sm font-medium focus:outline-none focus:border-[#0176D3] focus:bg-background transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Access Role</label>
            <div className="h-10">
              <Select value={filters.role} onValueChange={(v) => setFilters({...filters, role: v || "all"})}>
                <SelectTrigger className="w-full h-full bg-muted/5 rounded-sm border text-xs font-semibold focus:ring-0 focus:border-[#0176D3] focus:bg-background px-4">
                  {filters.role === "all" ? "All Roles" : ROLE_MAP[filters.role]}
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs font-semibold py-2">All Roles</SelectItem>
                  {Object.entries(ROLE_MAP).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs font-semibold py-2">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Organization</label>
            <div className="h-10">
              <Select value={filters.companyId} onValueChange={(v) => setFilters({...filters, companyId: v || "all"})}>
                <SelectTrigger className="w-full h-full bg-muted/5 rounded-sm border text-xs font-semibold focus:ring-0 focus:border-[#0176D3] focus:bg-background px-4">
                  {filters.companyId === "all" ? "All Companies" : companies.find(c => c.id === filters.companyId)?.name || filters.companyId}
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs font-semibold py-2">All Companies</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-semibold py-2">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Department</label>
            <div className="h-10">
              <Select value={filters.departmentId} onValueChange={(v) => setFilters({...filters, departmentId: v || "all"})}>
                <SelectTrigger className="w-full h-full bg-muted/5 rounded-sm border text-xs font-semibold focus:ring-0 focus:border-[#0176D3] focus:bg-background px-4">
                  {filters.departmentId === "all" ? "All Departments" : departments.find(d => d.id === filters.departmentId)?.name || filters.departmentId}
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs font-semibold py-2">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-xs font-semibold py-2">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Location</label>
            <div className="h-10">
              <Select value={filters.locationId} onValueChange={(v) => setFilters({...filters, locationId: v || "all"})}>
                <SelectTrigger className="w-full h-full bg-muted/5 rounded-sm border text-xs font-semibold focus:ring-0 focus:border-[#0176D3] focus:bg-background px-4">
                  {filters.locationId === "all" ? "All Locations" : locations.find(l => l.id === filters.locationId)?.name || filters.locationId}
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs font-semibold py-2">All Locations</SelectItem>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={l.id} className="text-xs font-semibold py-2">{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Designation</label>
            <div className="h-10">
              <Select value={filters.designationId} onValueChange={(v) => setFilters({...filters, designationId: v || "all"})}>
                <SelectTrigger className="w-full h-full bg-muted/5 rounded-sm border text-xs font-semibold focus:ring-0 focus:border-[#0176D3] focus:bg-background px-4">
                  {filters.designationId === "all" ? "All Designations" : designations.find(d => d.id === filters.designationId)?.title || filters.designationId}
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs font-semibold py-2">All Designations</SelectItem>
                  {designations.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-xs font-semibold py-2">{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

    <div className="border shadow-none overflow-hidden bg-white dark:bg-[#1A1A1A] rounded-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-b">
            <TableRow>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Name</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Email</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Role</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Company</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Department</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Designation</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Location</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Phone</TableHead>
              <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-10 px-4">Superior</TableHead>
              <TableHead className="w-[100px] h-10 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground font-medium text-xs bg-muted/5">
                  No users found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/5 border-b transition-colors">
                  <TableCell className="px-4 py-3 font-semibold text-sm whitespace-nowrap">{user.name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{user.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase border px-2 py-1 rounded-sm tracking-wider",
                      ROLE_COLORS[user.role] || ROLE_COLORS.USER
                    )}>
                      {ROLE_MAP[user.role] || user.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">{user.company?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">{user.department?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">{user.designation?.title || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">{user.location?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap font-medium">{user.phone || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">{user.superior?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <EditUserDialog 
                        user={user} 
                        companies={companies} 
                        departments={departments} 
                        locations={locations} 
                        designations={designations}
                        users={users}
                      />
                      <DeleteUserButton id={user.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-muted/20 border-t gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Show</span>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs font-bold bg-background">
                  <SelectValue placeholder={String(itemsPerPage)} />
                </SelectTrigger>
                <SelectContent className="min-w-[70px]">
                  {[10, 15, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs font-bold">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-foreground">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="text-foreground">{sortedUsers.length}</span> users
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              {"<"}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 p-0 text-xs",
                    currentPage === page ? "bg-[#0176D3]" : ""
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              {">"}
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

