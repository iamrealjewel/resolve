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

      <div className="border-2 shadow-none overflow-hidden bg-white dark:bg-[#1A1A1A]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] pl-8 h-12">Personnel Details</TableHead>
                <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-12">Role & Position</TableHead>
                <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-12">Organization</TableHead>
                <TableHead className="font-bold text-foreground uppercase tracking-wider text-[10px] h-12">Workstation</TableHead>
                <TableHead className="w-[140px] h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-black uppercase tracking-[0.2em] text-xs bg-muted/5">
                    No identity records match the active filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/5 border-b border-muted/10 transition-all group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-5">
                        <Avatar className="size-12 rounded border-2 border-muted-foreground/10 shadow-sm transition-transform group-hover:scale-105">
                          <AvatarImage src={user.avatar || "/avatars/01.png"} />
                          <AvatarFallback className="rounded font-bold text-sm bg-[#0176D3] text-white uppercase">{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground group-hover:text-[#0176D3] transition-colors tracking-tight leading-tight">{user.name}</span>
                          <div className="flex flex-col mt-2 gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                              <Building2 className="size-3 text-[#0176D3]/50" /> {user.department?.name || "No Department"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                              <Phone className="size-3 text-[#0176D3]/50" /> {user.phone || "No Contact"}
                            </span>
                            {user.superior && (
                              <div className="flex items-center gap-2 mt-1">
                                <Shield className="size-3 text-[#0176D3]" />
                                <span className="text-[10px] text-[#0176D3] font-bold tracking-tight">Reporting to: {user.superior.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold tracking-wider text-foreground leading-none">{ROLE_MAP[user.role] || user.role}</span>
                        <div className="h-px w-8 bg-[#0176D3]/20" />
                        <span className="text-[10px] font-bold text-muted-foreground leading-none">{user.designation?.title || "Personnel"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-foreground tracking-tight">{user.company?.name || "Global Entity"}</span>
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-[#0176D3]/40" />
                          <span className="text-[11px] font-bold text-foreground leading-none">{user.location?.name || "Remote"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end pr-8">
                        <EditUserDialog 
                          user={user} 
                          companies={companies} 
                          departments={departments} 
                          locations={locations} 
                          designations={designations}
                          users={users}
                        />
                        <div className="w-px h-6 bg-muted-foreground/10 mx-1" />
                        <DeleteUserButton id={user.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

