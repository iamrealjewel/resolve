"use client";

import { useState, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  UserPlus, 
  Search, 
  Loader2, 
  Shield, 
  Building2, 
  MapPin, 
  Briefcase,
  ChevronDown,
  Edit2,
  Check,
  UserCircle2,
  Phone,
  User
} from "lucide-react";
import { toast } from "sonner";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROLE_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DEPARTMENT_HEAD: "Dept Head",
  LINE_MANAGER: "Manager",
  RESOLVER: "Resolver",
  USER: "Standard User",
};

function getTreeList(depts: any[], parentId: string | null = null, depth = 0): any[] {
  return depts
    .filter(d => d.parentId === parentId)
    .reduce((acc, d) => [
      ...acc,
      { ...d, depth },
      ...getTreeList(depts, d.id, depth + 1)
    ], [] as any[]);
}

// High-Performance Superior Picker
function SuperiorPicker({ value, onValueChange, users }: { value: string | null, onValueChange: (v: string | null) => void, users: any[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!search) return users.slice(0, 100);
    return users.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100);
  }, [users, search]);

  const selectedUser = users.find(u => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        className="w-full h-9 justify-between bg-transparent rounded-sm border text-sm font-medium px-3 hover:bg-muted/50 transition-all flex items-center text-left"
      >
        {selectedUser ? (
          <span className="truncate">{selectedUser.name}</span>
        ) : (
          <span className="text-muted-foreground font-normal">Select Direct Superior</span>
        )}
        <ChevronDown className="size-4 opacity-50 ml-2" />
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-none border shadow-xl" align="start">
        <div className="flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-10 bg-background border-muted-foreground/20 rounded-none text-xs font-medium focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 rounded-none text-xs font-bold text-primary hover:bg-primary/5 px-3"
              onClick={() => {
                onValueChange(null);
                setOpen(false);
              }}
            >
              <UserCircle2 className="mr-2 size-4" /> NO SUPERIOR (TOP LEVEL)
            </Button>
            <div className="h-px bg-muted my-1" />
            {filteredUsers.map((u) => (
              <Button
                key={u.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-14 rounded-none px-3 gap-3 hover:bg-muted/50 transition-colors",
                  value === u.id && "bg-primary/5 border-l-2 border-primary"
                )}
                onClick={() => {
                  onValueChange(u.id);
                  setOpen(false);
                }}
              >
                <Avatar className="size-8 rounded-none border">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback className="rounded-none text-[10px] font-black">{u.name.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-xs font-bold text-foreground truncate w-full text-left">{u.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest truncate w-full text-left">{u.designation?.title || u.role}</span>
                </div>
                {value === u.id && <Check className="ml-auto size-4 text-primary" />}
              </Button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">
                No personnel records found.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryPicker({ value, onValueChange, categories }: { value: string[], onValueChange: (v: string[]) => void, categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategoryTree = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: any[] = [];
    map.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) parent.children.push(c);
      } else {
        roots.push(c);
      }
    });

    if (!search) return roots;

    const filter = (list: any[]): any[] => {
      const results: any[] = [];
      for (const cat of list) {
        const matches = cat.name.toLowerCase().includes(search.toLowerCase());
        const filteredChildren = cat.children ? filter(cat.children) : [];

        if (matches || filteredChildren.length > 0) {
          results.push({
            ...cat,
            children: filteredChildren,
            _isMatch: matches
          });
        }
      }
      return results;
    };

    return filter(roots);
  }, [categories, search]);

  const toggleCategory = (id: string) => {
    if (value.includes(id)) {
      onValueChange(value.filter(v => v !== id));
    } else {
      onValueChange([...value, id]);
    }
  };

  const TreeItem = ({ category, depth = 0 }: { category: any, depth?: number }) => {
    const isSelected = value.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="flex flex-col">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 rounded-none px-3 gap-2 transition-colors border-b border-muted/20",
            isSelected && "bg-primary/5 text-primary font-bold",
            category._isMatch && search && "bg-amber-50 dark:bg-amber-900/10"
          )}
          onClick={() => toggleCategory(category.id)}
        >
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
            <div className={cn(
              "size-4 rounded-sm border flex items-center justify-center transition-all",
              isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="size-3" />}
            </div>
            <span className={cn(
              "text-[11px] uppercase tracking-wider",
              category._isMatch && search && "text-amber-700 dark:text-amber-400"
            )}>
              {category.name}
            </span>
          </div>
        </Button>
        {category.children.map((child: any) => (
          <TreeItem key={child.id} category={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full min-h-[36px] h-auto justify-between bg-transparent rounded-sm border text-sm font-medium px-3 py-2 hover:bg-muted/50 transition-all flex items-center text-left">
        <div className="flex flex-wrap gap-1">
          {value.length > 0 ? (
            value.map(id => (
              <div key={id} className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase border border-primary/20">
                {categories.find(c => c.id === id)?.name || id}
              </div>
            ))
          ) : (
            <span className="text-muted-foreground font-normal">All Categories (Unrestricted)</span>
          )}
        </div>
        <ChevronDown className="size-4 opacity-50 ml-2 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-none border shadow-xl" align="start">
        <div className="flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search categories..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10 bg-background border-muted-foreground/20 rounded-none text-xs font-medium"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCategoryTree.map(root => (
              <TreeItem key={root.id} category={root} />
            ))}
            {filteredCategoryTree.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">
                No matching categories found.
              </div>
            )}
          </div>
          {value.length > 0 && (
            <div className="p-3 border-t bg-muted/30">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => onValueChange([])}
              >
                Clear Restrictions (Allow All)
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function UserProvisioningDialog({ companies, departments, locations, designations, users, categories }: { 
  companies: any[], 
  departments: any[], 
  locations: any[],
  designations: any[],
  users: any[],
  categories: any[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    companyId: "",
    departmentId: "",
    locationId: "",
    designationId: "",
    superiorId: "",
    phone: "",
    allowedCategoryIds: [] as string[]
  });

  const [searchStates, setSearchStates] = useState({
    department: "",
    designation: "",
    location: ""
  });

  const filteredDepartments = useMemo(() => {
    const tree = getTreeList(departments);
    if (!searchStates.department) return tree;
    return tree.filter(d => d.name.toLowerCase().includes(searchStates.department.toLowerCase()));
  }, [departments, searchStates.department]);

  const filteredDesignations = useMemo(() => {
    if (!searchStates.designation) return designations;
    return designations.filter(d => d.title.toLowerCase().includes(searchStates.designation.toLowerCase()));
  }, [designations, searchStates.designation]);

  const filteredLocations = useMemo(() => {
    if (!searchStates.location) return locations;
    return locations.filter(l => l.name.toLowerCase().includes(searchStates.location.toLowerCase()));
  }, [locations, searchStates.location]);

  async function handleProvision() {
    if (!form.name || !form.email || !form.password || !form.companyId || !form.role) {
      return toast.error("Required fields: Name, Email, Password, Company, Role");
    }
    
    setIsSubmitting(true);
    try {
      const { provisionUser } = await import("@/app/actions/master");
      await provisionUser({
        ...form,
        departmentId: form.departmentId || null,
        locationId: form.locationId || null,
        designationId: form.designationId || null,
        superiorId: form.superiorId || null,
        phone: form.phone || null,
        allowedCategoryIds: form.allowedCategoryIds,
      });
      toast.success("Identity provisioned successfully");
      setIsOpen(false);
      setForm({
        name: "", email: "", password: "", role: "USER",
        companyId: "", departmentId: "", locationId: "",
        designationId: "", superiorId: "", phone: ""
      });
    } catch (error) {
      toast.error("Provisioning failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        asChild
      >
        <Button size="sm" className="h-9 px-4 rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-xs">
          <UserPlus className="mr-2 size-4" /> Provision Personnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-5 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className="size-9 bg-[#0176D3] rounded flex items-center justify-center">
             <Shield className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-base font-semibold text-foreground leading-none mb-1">New User</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Provision organizational credentials</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Identity</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Access Password</Label>
                <Input 
                  type="password"
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Contact Phone</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* ORGANIZATIONAL ASSIGNMENT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Building2 className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Organizational Assignment</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Access Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v || "USER" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {ROLE_MAP[form.role] || form.role}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_MAP).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-sm">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Entity</Label>
                <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.companyId ? (companies.find(c => c.id === form.companyId)?.name || form.companyId) : <span className="text-muted-foreground font-normal">Select entity...</span>}
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                <Select value={form.departmentId || ""} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.departmentId ? (departments.find(d => d.id === form.departmentId)?.name || form.departmentId) : <span className="text-muted-foreground font-normal">Select department...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Global / Unassigned</SelectItem>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">
                        <span className="opacity-40 font-normal">{"— ".repeat(d.depth)}</span>{d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Designation</Label>
                <Select value={form.designationId || ""} onValueChange={(v) => setForm({ ...form, designationId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.designationId ? (designations.find(d => d.id === form.designationId)?.title || form.designationId) : <span className="text-muted-foreground font-normal">Select title...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Standard Title</SelectItem>
                    {filteredDesignations.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Primary Site</Label>
                <Select value={form.locationId || ""} onValueChange={(v) => setForm({ ...form, locationId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.locationId ? (locations.find(l => l.id === form.locationId)?.name || form.locationId) : <span className="text-muted-foreground font-normal">Select location...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Remote / Node</SelectItem>
                    {filteredLocations.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-sm">{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Reporting Manager</Label>
                <SuperiorPicker 
                  value={form.superiorId} 
                  onValueChange={(v) => setForm({ ...form, superiorId: v || "" })}
                  users={users}
                />
              </div>
            </div>
          </div>
          {/* ACCESS PARAMETERS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Shield className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Access Parameters</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Allowed Incident Categories</Label>
              <CategoryPicker 
                value={form.allowedCategoryIds} 
                onValueChange={(v) => setForm({ ...form, allowedCategoryIds: v })}
                categories={categories}
              />
              <p className="text-[10px] text-muted-foreground italic">If no categories are selected, the user will have access to all categories.</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-muted/10">
          <Button 
            onClick={handleProvision} 
            disabled={isSubmitting}
            className="w-full h-10 font-semibold text-sm rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Shield className="size-4 mr-2" />}
            Provision Personnel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({ user, companies, departments, locations, designations, users, categories }: { 
  user: any, 
  companies: any[], 
  departments: any[], 
  locations: any[],
  designations: any[],
  users: any[],
  categories: any[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    password: "",
    role: user.role || "USER",
    companyId: user.companyId || "",
    departmentId: user.departmentId || "",
    locationId: user.locationId || "",
    designationId: user.designationId || "",
    superiorId: user.superiorId || "",
    phone: user.phone || "",
    allowedCategoryIds: (user.allowedCategories?.map((c: any) => c.id) || []) as string[]
  });

  const [searchStates, setSearchStates] = useState({
    department: "",
    designation: "",
    location: ""
  });

  const filteredDepartments = useMemo(() => {
    const tree = getTreeList(departments);
    if (!searchStates.department) return tree;
    return tree.filter(d => d.name.toLowerCase().includes(searchStates.department.toLowerCase()));
  }, [departments, searchStates.department]);

  const filteredDesignations = useMemo(() => {
    if (!searchStates.designation) return designations;
    return designations.filter(d => d.title.toLowerCase().includes(searchStates.designation.toLowerCase()));
  }, [designations, searchStates.designation]);

  const filteredLocations = useMemo(() => {
    if (!searchStates.location) return locations;
    return locations.filter(l => l.name.toLowerCase().includes(searchStates.location.toLowerCase()));
  }, [locations, searchStates.location]);

  async function handleEdit() {
    if (!form.name || !form.companyId || !form.role) {
      return toast.error("Required fields: Name, Company, Role");
    }
    
    setIsSubmitting(true);
    try {
      const { updateUser } = await import("@/app/actions/master");
      await updateUser(user.id, {
        ...form,
        departmentId: form.departmentId || null,
        locationId: form.locationId || null,
        designationId: form.designationId || null,
        superiorId: form.superiorId || null,
        phone: form.phone || null,
        allowedCategoryIds: form.allowedCategoryIds,
      });
      toast.success("User profile updated");
      setIsOpen(false);
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-muted transition-all">
          <Edit2 className="size-4 text-muted-foreground hover:text-[#0176D3]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-5 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className="size-9 bg-[#0176D3] rounded flex items-center justify-center">
             <Edit2 className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-base font-semibold text-foreground leading-none mb-1">Modify Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Update identity and assignment</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6 overflow-y-auto max-h-[70vh]">
          {/* PERSONAL INFORMATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Profile Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Reset Password</Label>
                <Input 
                  type="password"
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to maintain current"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Contact Phone</Label>
                <Input 
                  className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ORGANIZATIONAL ASSIGNMENT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Building2 className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Corporate Assignment</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Access Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v || "USER" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {ROLE_MAP[form.role] || form.role}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_MAP).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-sm">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Entity</Label>
                <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.companyId ? (companies.find(c => c.id === form.companyId)?.name || form.companyId) : <span className="text-muted-foreground font-normal">Select entity...</span>}
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                <Select value={form.departmentId || ""} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.departmentId ? (departments.find(d => d.id === form.departmentId)?.name || form.departmentId) : <span className="text-muted-foreground font-normal">Select department...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Global / Unassigned</SelectItem>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">
                        <span className="opacity-40 font-normal">{"— ".repeat(d.depth)}</span>{d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Designation</Label>
                <Select value={form.designationId || ""} onValueChange={(v) => setForm({ ...form, designationId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.designationId ? (designations.find(d => d.id === form.designationId)?.title || form.designationId) : <span className="text-muted-foreground font-normal">Select title...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Standard Title</SelectItem>
                    {filteredDesignations.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Primary Site</Label>
                <Select value={form.locationId || ""} onValueChange={(v) => setForm({ ...form, locationId: v || "" })}>
                  <SelectTrigger className="h-9 bg-transparent rounded-sm border text-sm font-medium w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                    {form.locationId ? (locations.find(l => l.id === form.locationId)?.name || form.locationId) : <span className="text-muted-foreground font-normal">Select location...</span>}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="" className="text-sm">Remote / Node</SelectItem>
                    {filteredLocations.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-sm">{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Reporting Manager</Label>
                <SuperiorPicker 
                  value={form.superiorId} 
                  onValueChange={(v) => setForm({ ...form, superiorId: v || "" })}
                  users={users}
                />
              </div>
            </div>
          </div>
          {/* ACCESS PARAMETERS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Shield className="size-4 text-[#0176D3]" />
              <span className="text-sm font-semibold">Access Parameters</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Allowed Incident Categories</Label>
              <CategoryPicker 
                value={form.allowedCategoryIds} 
                onValueChange={(v) => setForm({ ...form, allowedCategoryIds: v })}
                categories={categories}
              />
              <p className="text-[10px] text-muted-foreground italic">If no categories are selected, the user will have access to all categories.</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-muted/10">
          <Button 
            onClick={handleEdit} 
            disabled={isSubmitting}
            className="w-full h-10 font-semibold text-sm rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Update Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
