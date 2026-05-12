"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Shared utility for hierarchical listing
const getTreeList = (items: any[], parentId: string | null = null, depth = 0): any[] => {
  return items
    .filter(item => item.parentId === parentId)
    .flatMap(item => [
      { ...item, depth },
      ...getTreeList(items, item.id, depth + 1)
    ]);
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
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
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Tag, Building2, MapPin, Briefcase, Edit2, X, Check, Trash2, Database } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  createDepartment,
  createLocation,
  createDesignation,
  createRoutingRule,
  updateDepartment,
  updateLocation,
  updateDesignation,
  createDataTemplate,
  updateDataTemplate
} from "@/app/actions/master";

export function CategoryDialog({
  categories,
  users,
  item,
  defaultParentId
}: {
  categories: any[],
  users: any[],
  templates: any[],
  item?: any,
  defaultParentId?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(item?.name || "");
  const [parentId, setParentId] = useState<string | null>(item?.parentId || defaultParentId || "none");
  const [requiresRaiserApproval, setRequiresRaiserApproval] = useState(item?.requiresRaiserApproval || false);
  const [requiresResolverApproval, setRequiresResolverApproval] = useState(item?.requiresResolverApproval || false);
  const [raiserApprovers, setRaiserApprovers] = useState<string[]>(item?.approvers?.filter((a: any) => a.type === "RAISER").map((a: any) => a.userId) || []);
  const [resolverApprovers, setResolverApprovers] = useState<string[]>(item?.approvers?.filter((a: any) => a.type === "RESOLVER").map((a: any) => a.userId) || []);
  const [templateId, setTemplateId] = useState<string | null>(item?.templateId || "none");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setParentId(item.parentId || "none");
        setRequiresRaiserApproval(item.requiresRaiserApproval);
        setRequiresResolverApproval(item.requiresResolverApproval);
        setRaiserApprovers(item.approvers?.filter((a: any) => a.type === "RAISER").map((a: any) => a.userId) || []);
        setResolverApprovers(item.approvers?.filter((a: any) => a.type === "RESOLVER").map((a: any) => a.userId) || []);
        setTemplateId(item.templateId || "none");
      } else {
        setName("");
        setParentId(defaultParentId || "none");
        setRequiresRaiserApproval(false);
        setRequiresResolverApproval(false);
        setRaiserApprovers([]);
        setResolverApprovers([]);
        setTemplateId("none");
      }
    }
  }, [isOpen, item, defaultParentId]);

  async function handleAction() {
    if (!name) return toast.error("Category name is required");
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        parentId: parentId === "none" ? null : parentId,
        requiresRaiserApproval,
        requiresResolverApproval,
        raiserApprovers,
        resolverApprovers,
        templateId: templateId === "none" ? null : templateId
      };

      if (item) {
        await updateCategory(item.id, payload);
        toast.success("Category updated successfully");
      } else {
        await createCategory(payload);
        toast.success("Category created successfully");
        setName("");
        setParentId("none");
        setRequiresRaiserApproval(false);
        setRequiresResolverApproval(false);
        setRaiserApprovers([]);
        setResolverApprovers([]);
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(item ? "Failed to update category" : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          item || defaultParentId ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9 rounded-none transition-all">
              {defaultParentId ? <Plus className="size-4 text-primary" /> : <Edit2 className="size-4" />}
            </Button>
          ) : (
            <Button size="sm" className="font-bold uppercase tracking-wider px-6 h-9 rounded-none shadow-lg shadow-primary/10">
              <Plus className="mr-2 size-4" /> Add Category
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-6 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className="size-10 bg-[#0176D3] flex items-center justify-center rounded-sm">
            <Tag className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-lg font-bold text-foreground leading-none mb-1">{item ? "Modify Classification" : "New Classification"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-none">{item ? "Update classification properties" : "Define a new system classification entry"}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Classification Name</Label>
            <Input
              className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Deployment"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Hierarchy Attachment</Label>
            <Select value={parentId || "none"} onValueChange={setParentId}>
              <SelectTrigger className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                {parentId === "none" ? <span className="text-muted-foreground font-normal">Root Category</span> : (categories.find(c => c.id === parentId)?.name || "Root Category")}
              </SelectTrigger>
              <SelectContent className="rounded-none border-2">
                <SelectItem value="none" className="font-bold py-3 uppercase text-[10px] tracking-widest">None (Root Category)</SelectItem>
                {getTreeList(categories.filter(c => c.id !== item?.id)).map(c => (
                  <SelectItem key={c.id} value={c.id} className="py-3">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: c.depth }).map((_, i) => (
                        <div key={i} className="w-4 border-l h-4 border-muted-foreground/30 -ml-1" />
                      ))}
                      <span className={cn(c.depth > 0 ? "text-xs font-medium text-muted-foreground" : "text-sm font-bold uppercase tracking-tighter")}>
                        {c.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 mt-2 space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0176D3]">Approval Matrix Configuration</Label>

            <div className="grid grid-cols-1 gap-4">
              {/* Business Approval Section */}
              <div className="space-y-4 p-4 border rounded-sm bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold uppercase tracking-tight">Business Approval</Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">Wait for reporter's superior or specific approvers.</p>
                  </div>
                  <Button
                    type="button"
                    variant={requiresRaiserApproval ? "default" : "outline"}
                    size="sm"
                    className={cn("h-7 text-[10px] px-3 font-bold", requiresRaiserApproval ? "bg-[#0176D3] text-white" : "")}
                    onClick={() => setRequiresRaiserApproval(!requiresRaiserApproval)}
                  >
                    {requiresRaiserApproval ? "ENABLED" : "DISABLED"}
                  </Button>
                </div>

                {requiresRaiserApproval && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Custom Approver Override</Label>
                    <Select onValueChange={(val) => val && !raiserApprovers.includes(val) && setRaiserApprovers([...raiserApprovers, val])}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <span>Add user...</span>
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => !raiserApprovers.includes(u.id)).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {raiserApprovers.map(id => (
                        <Badge key={id} variant="secondary" className="text-[10px] py-0 h-5 gap-1 pr-1 bg-white border font-medium">
                          {users.find(u => u.id === id)?.name}
                          <button type="button" onClick={() => setRaiserApprovers(raiserApprovers.filter(uid => uid !== id))} className="hover:text-destructive">
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                      {raiserApprovers.length === 0 && <span className="text-[10px] italic text-muted-foreground">Default: Reporter's Line Manager</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Operational Approval Section */}
              <div className="space-y-4 p-4 border rounded-sm bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold uppercase tracking-tight">Operational Approval</Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">Wait for resolver's admin or specific approvers.</p>
                  </div>
                  <Button
                    type="button"
                    variant={requiresResolverApproval ? "default" : "outline"}
                    size="sm"
                    className={cn("h-7 text-[10px] px-3 font-bold", requiresResolverApproval ? "bg-[#0176D3] text-white" : "")}
                    onClick={() => setRequiresResolverApproval(!requiresResolverApproval)}
                  >
                    {requiresResolverApproval ? "ENABLED" : "DISABLED"}
                  </Button>
                </div>

                {requiresResolverApproval && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Custom Approver Override</Label>
                    <Select onValueChange={(val) => val && !resolverApprovers.includes(val) && setResolverApprovers([...resolverApprovers, val])}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <span>Add user...</span>
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => !resolverApprovers.includes(u.id)).map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {resolverApprovers.map(id => (
                        <Badge key={id} variant="secondary" className="text-[10px] py-0 h-5 gap-1 pr-1 bg-white border font-medium">
                          {users.find(u => u.id === id)?.name}
                          <button type="button" onClick={() => setResolverApprovers(resolverApprovers.filter(uid => uid !== id))} className="hover:text-destructive">
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                      {resolverApprovers.length === 0 && <span className="text-[10px] italic text-muted-foreground">Default: Resolver Group Admin</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0176D3]">Data Template Assignment</Label>
            <div className="p-4 border rounded-sm bg-[#0176D3]/5 border-[#0176D3]/10">
              <p className="text-[10px] text-muted-foreground leading-tight mb-3">Require users to fill out a structured data sheet when creating incidents in this category.</p>
              <Select value={templateId || "none"} onValueChange={setTemplateId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="No template required" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs font-bold uppercase tracking-wider italic text-muted-foreground">None / Not Required</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-muted/10">
          <Button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full h-10 font-semibold text-sm rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Tag className="size-4 mr-2" />}
            {item ? "Update Classification" : "Register Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InfrastructureDialog({
  type,
  companies,
  departments,
  item,
  defaultParentId
}: {
  type: "department" | "location" | "designation",
  companies?: any[],
  departments?: any[],
  item?: any,
  defaultParentId?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(item?.name || item?.title || "");
  const [parentId, setParentId] = useState<string | null>(item?.departmentId || "none");
  const [departmentParentId, setDepartmentParentId] = useState<string | null>(item?.parentId || defaultParentId || "none");

  useEffect(() => {
    if (isOpen && !item) {
      setName("");
      setParentId(type === "designation" ? (departments?.[0]?.id || "none") : "none");
      setDepartmentParentId(defaultParentId || "none");
    }
  }, [isOpen, item, type, departments, defaultParentId]);

  const config = {
    department: { title: item ? "Modify Department" : "New Department", label: "Department Identity", icon: Building2, color: "bg-emerald-600", shadow: "shadow-emerald-500/20" },
    location: { title: item ? "Modify Location" : "New Location", label: "Operational Site", icon: MapPin, color: "bg-blue-600", shadow: "shadow-blue-500/20" },
    designation: { title: item ? "Modify Designation" : "New Designation", label: "Professional Title", icon: Briefcase, color: "bg-amber-600", shadow: "shadow-amber-500/20" },
  }[type];

  async function handleAction() {
    if (!name) return toast.error("Name is required");
    setIsSubmitting(true);
    try {
      if (item) {
        if (type === "department") await updateDepartment(item.id, {
          name,
          parentId: departmentParentId === "none" ? null : departmentParentId
        });
        if (type === "location") await updateLocation(item.id, { name });
        if (type === "designation") await updateDesignation(item.id, { title: name });
        toast.success(`${type} updated successfully`);
      } else {
        if (type === "department") await createDepartment({
          name,
          parentId: departmentParentId === "none" ? null : departmentParentId
        });
        if (type === "location") await createLocation({ name });
        if (type === "designation") await createDesignation({ title: name });

        toast.success(`${type} created successfully`);
        setName("");
        setDepartmentParentId("none");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(item ? `Failed to update ${type}` : `Failed to create ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          item || defaultParentId ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9 rounded-none transition-all">
              {defaultParentId ? <Plus className="size-4 text-primary" /> : <Edit2 className="size-4" />}
            </Button>
          ) : (
            <Button size="sm" className="font-bold uppercase tracking-wider px-6 h-9 rounded-none shadow-lg shadow-primary/10">
              <Plus className="mr-2 size-4" /> Add {type === 'department' ? 'Department' : type === 'location' ? 'Location' : 'Designation'}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-6 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className={cn("size-10 flex items-center justify-center rounded-sm", config.color)}>
            <config.icon className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-lg font-bold text-foreground leading-none mb-1">{config.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-none">Manage organizational infrastructure parameters</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">{config.label}</Label>
            <Input
              className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="System Label"
            />
          </div>

          {type === "department" && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Parent Department</Label>
              <Select value={departmentParentId} onValueChange={setDepartmentParentId}>
                <SelectTrigger className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                  {departmentParentId === "none" ? <span className="text-muted-foreground font-normal">Root Department</span> : (departments?.find(d => d.id === departmentParentId)?.name || "Root Department")}
                </SelectTrigger>
                <SelectContent className="rounded-none border-2">
                  <SelectItem value="none" className="font-bold py-3 uppercase text-[10px] tracking-widest">None (Root Department)</SelectItem>
                  {getTreeList((departments || []).filter(d => d.id !== item?.id)).map(d => (
                    <SelectItem key={d.id} value={d.id} className="py-3">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: d.depth }).map((_, i) => (
                          <div key={i} className="w-4 border-l h-4 border-muted-foreground/30 -ml-1" />
                        ))}
                        <span className={cn(d.depth > 0 ? "text-xs font-medium text-muted-foreground" : "text-sm font-bold uppercase tracking-tighter")}>
                          {d.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="p-8 border-t bg-muted/20">
          <Button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full h-14 font-black uppercase tracking-[0.2em] text-xs rounded-none shadow-xl shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : (
              <span className="flex items-center gap-2">{item ? "Finalize Modifications" : `Confirm ${type} Creation`}</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RoutingRuleDialog({
  categories,
  departments,
  users,
  item
}: {
  categories: any[],
  departments: any[],
  users: any[],
  item?: any
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId || "");
  const [departmentId, setDepartmentId] = useState<string | null>(item?.departmentId || "");

  useEffect(() => {
    if (isOpen && !item) {
      setCategoryId("");
      setDepartmentId("");
    }
  }, [isOpen, item]);

  async function handleAction() {
    if (!categoryId || !departmentId) return toast.error("Classification and Assigned Unit are required");
    setIsSubmitting(true);
    try {
      const payload = {
        categoryId,
        departmentId
      };

      if (item) {
        await updateRoutingRule(item.id, payload);
        toast.success("Routing protocol updated");
      } else {
        await createRoutingRule(payload);
        toast.success("Routing protocol established");
        setCategoryId("");
        setDepartmentId("");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(item ? "Failed to update routing rule" : "Failed to establish routing rule");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          item ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9 rounded-none transition-all">
              <Edit2 className="size-4" />
            </Button>
          ) : (
            <Button size="sm" className="font-bold uppercase tracking-wider px-6 h-9 rounded-none shadow-lg shadow-primary/10">
              <Plus className="mr-2 size-4" /> Add Routing Rule
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-6 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className="size-10 bg-[#0176D3] flex items-center justify-center rounded-sm">
            <Briefcase className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-lg font-bold text-foreground leading-none mb-1">{item ? "Modify Protocol" : "Workflow Routing"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-none">Automate incident assignment via taxonomy logic</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Classification</Label>
              <Select value={categoryId || ""} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                  {categoryId ? (categories.find(c => c.id === categoryId)?.name || "Select...") : <span className="text-muted-foreground font-normal">Select...</span>}
                </SelectTrigger>
                <SelectContent className="rounded-none border-2">
                  {getTreeList(categories).map(c => (
                    <SelectItem key={c.id} value={c.id} className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: c.depth }).map((_, i) => (
                          <div key={i} className="w-4 border-l h-4 border-muted-foreground/30 -ml-1" />
                        ))}
                        <span className={cn(c.depth > 0 ? "text-xs font-medium text-muted-foreground" : "text-sm font-bold")}>
                          {c.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Assigned Unit</Label>
              <Select value={departmentId || ""} onValueChange={setDepartmentId}>
                <SelectTrigger className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus:ring-0 focus:border-[#0176D3]">
                  {departmentId ? (departments.find(d => d.id === departmentId)?.name || "Select...") : <span className="text-muted-foreground font-normal">Select...</span>}
                </SelectTrigger>
                <SelectContent className="rounded-none border-2">
                  {getTreeList(departments).map(d => (
                    <SelectItem key={d.id} value={d.id} className="py-3">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: d.depth }).map((_, i) => (
                          <div key={i} className="w-4 border-l h-4 border-muted-foreground/30 -ml-1" />
                        ))}
                        <span className={cn(d.depth > 0 ? "text-xs font-medium text-muted-foreground" : "text-sm font-bold uppercase tracking-tighter")}>
                          {d.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-8 border-t bg-muted/20">
          <Button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full h-14 font-black uppercase tracking-[0.2em] text-xs rounded-none shadow-xl shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : (
              <span className="flex items-center gap-2">{item ? "Update Protocol" : "Establish Routing Logic"}</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DataTemplateDialog({
  item
}: {
  item?: any
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [fields, setFields] = useState<any[]>(item?.fields || [{ name: "", type: "string", required: true }]);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setDescription(item.description || "");
        setFields(item.fields || []);
      } else {
        setName("");
        setDescription("");
        setFields([{ name: "", type: "string", required: true }]);
      }
    }
  }, [isOpen, item]);

  const addField = () => setFields([...fields, { name: "", type: "string", required: true }]);
  const removeField = (index: number) => setFields(fields.filter((_, i) => i !== index));
  const updateField = (index: number, updates: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  async function handleAction() {
    if (!name) return toast.error("Template name is required");
    if (fields.length === 0) return toast.error("At least one field is required");
    if (fields.some(f => !f.name)) return toast.error("All fields must have a name");

    setIsSubmitting(true);
    try {
      const payload = { name, description, fields };
      if (item) {
        await updateDataTemplate(item.id, payload);
        toast.success("Template updated successfully");
      } else {
        await createDataTemplate(payload);
        toast.success("Template created successfully");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Edit2 className="size-4" />
          </Button>
        ) : (
          <Button className="h-9 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white gap-2 px-4 font-bold text-xs rounded-sm">
            <Plus className="size-4" />
            CREATE TEMPLATE
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] p-0 overflow-hidden border-none rounded-none shadow-2xl">
        <DialogHeader className="p-8 bg-muted/30 border-b flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <DialogTitle className="text-lg font-bold text-foreground leading-none mb-1">{item ? "Modify Template" : "New Template"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-none">Define the worksheet columns and data types</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Template Name</Label>
              <Input
                className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Supplier Onboarding"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Description (Optional)</Label>
              <Input
                className="h-10 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0176D3]">Template Fields (Columns)</Label>
              <Button onClick={addField} type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold gap-1 px-3">
                <Plus className="size-3" /> ADD FIELD
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-sm bg-muted/5 relative group">
                  <div className="flex-[2] space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">Field Name</Label>
                    <Input
                      className="h-8 text-xs bg-background"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      placeholder="Column Header"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">Data Type</Label>
                    <Select value={field.type} onValueChange={(val) => updateField(index, { type: val })}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string" className="text-xs">Text (String)</SelectItem>
                        <SelectItem value="numeric" className="text-xs">Number (Numeric)</SelectItem>
                        <SelectItem value="email" className="text-xs">Email</SelectItem>
                        <SelectItem value="list" className="text-xs">Dropdown (List)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {field.type === "list" && (
                    <div className="flex-[2] space-y-1 animate-in slide-in-from-left-2 duration-200">
                      <Label className="text-[9px] font-bold uppercase text-muted-foreground">List Options (Comma Separated)</Label>
                      <Input
                        className="h-8 text-xs bg-background"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) => updateField(index, { options: e.target.value.split(",").map(o => o.trim()) })}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                  <div className="flex-none pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-sm">
                  <p className="text-xs text-muted-foreground">No fields defined yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="p-8 bg-muted/30 border-t gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-10 text-[10px] font-bold tracking-widest px-8 rounded-none border-2"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleAction}
            disabled={isSubmitting}
            className="h-10 bg-foreground text-background hover:bg-foreground/90 text-[10px] font-bold tracking-widest px-8 rounded-none min-w-[140px]"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : (item ? "SAVE CHANGES" : "CREATE TEMPLATE")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
