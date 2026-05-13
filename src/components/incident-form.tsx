"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createIncident, updateIncident, addComment, assignIncident, getResolverDeptUsers, uploadFile } from "@/app/actions/incidents";
import { approveIncident, rejectIncident } from "@/app/actions/approvals";

import {
  Loader2, Send, Search, MessageSquare, History, User, Building2, MapPin,
  Tag, Clock, UserPlus, ShieldCheck, Paperclip, FileText, FileIcon,
  ImageIcon, X, Download, ChevronRight, ChevronDown, ChevronLeft, Edit, Users, AlertCircle,
  FilePenLine, MessageSquarePlus, Plus, Check, CheckCircle2, ShieldAlert, FileSpreadsheet
} from "lucide-react";

import { TemplateGridDialog } from "./template-grid-dialog";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RelativeTime } from "./relative-time";
import { UserTagInput } from "./user-tag-input";
import { Editor } from "./ui/editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLOR_MAP: Record<string, string> = {
  NEW: "bg-blue-700 text-white",
  PENDING_BUSINESS_APPROVAL: "bg-amber-700 text-white",
  PENDING_OPERATIONAL_APPROVAL: "bg-orange-700 text-white",
  ASSIGNED: "bg-indigo-700 text-white",
  IN_PROGRESS: "bg-emerald-700 text-white",
  RESOLVED: "bg-slate-600 text-white",
  CLOSED: "bg-slate-800 text-white",
  REJECTED: "bg-rose-700 text-white",
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

const STATUS_MAP: Record<string, string> = {
  NEW: "Pending",
  PENDING_BUSINESS_APPROVAL: "Pending Business Approval",
  PENDING_OPERATIONAL_APPROVAL: "Pending Operational Approval",
  ASSIGNED: "WIP",
  IN_PROGRESS: "WIP",
  RESOLVED: "Closed",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (min 20 chars)"),
  company: z.string().min(1, "Please select a company"),
  location: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
  reporterId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  accessList: z.array(z.string()).default([]),
  reference: z.string().optional(),
});

interface IncidentFormProps {
  mode: "CREATE" | "EDIT" | "VIEW";
  initialData: {
    companies: any[];
    locations: any[];
    categories: any[];
    users: any[];
    incident?: any;
    sessionUser?: any;
  };
}


export function IncidentForm({ mode, initialData }: IncidentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [comment, setComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [resolverUsers, setResolverUsers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [attachments, setAttachments] = useState<any[]>(initialData.incident?.attachments || []);
  const [commentAttachments, setCommentAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [logStartDate, setLogStartDate] = useState<string>("");
  const [logEndDate, setLogEndDate] = useState<string>("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const incident = initialData.incident;
  const [templateData, setTemplateData] = useState<any[]>(incident?.templateData || []);

  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const isPendingBusiness = incident?.status === "PENDING_BUSINESS_APPROVAL";
  const isPendingOperational = incident?.status === "PENDING_OPERATIONAL_APPROVAL";

  const isBusinessApprover = incident?.raiserApproverId === user?.id ||
    incident?.category?.approvers?.some((a: any) => a.userId === user?.id && a.type === "RAISER") ||
    user?.role === "SUPER_ADMIN" ||
    (user?.role === "DEPARTMENT_HEAD" && incident?.departmentId === user?.departmentId);

  const isOperationalApprover = incident?.resolverApproverId === user?.id ||
    incident?.category?.approvers?.some((a: any) => a.userId === user?.id && a.type === "RESOLVER") ||
    user?.role === "SUPER_ADMIN" ||
    (user?.role === "DEPARTMENT_HEAD" && incident?.departmentId === user?.departmentId);

  const canApproveCurrentStage = (isPendingBusiness && isBusinessApprover) ||
    (isPendingOperational && isOperationalApprover);

  const isApprover = isBusinessApprover || isOperationalApprover;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isResolver = session?.user?.role === "RESOLVER";
  const isView = mode === "VIEW";
  const isEdit = mode === "EDIT";
  const isCreate = mode === "CREATE";

  const isReporter = initialData.incident?.reporterId === (session?.user as any)?.id;
  const isAssignee = initialData.incident?.assigneeId === (session?.user as any)?.id;
  const isResolverForCategory = !!session?.user && resolverUsers.some(u => u.id === (session.user as any).id);
  const isRestrictedRaiser = (user?.role === "USER" || user?.role === "LINE_MANAGER" || user?.role === "DEPARTMENT_HEAD") && !isSuperAdmin && !isResolver;

  const isActionLocked = isPendingOperational && !isSuperAdmin && !isApprover;
  const canModify = isCreate || ((isSuperAdmin || isResolver) && !isActionLocked);
  const effectiveIsView = isView || !canModify;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.incident?.title || "",
      description: initialData.incident?.description || "",
      priority: initialData.incident?.priority || "MEDIUM",
      company: initialData.incident?.companyId || initialData.sessionUser?.companyId || session?.user?.companyId || initialData.companies[0]?.id || "",
      location: initialData.incident?.locationId || initialData.sessionUser?.locationId || (session?.user as any)?.locationId || "",
      reporterId: initialData.incident?.reporterId || initialData.sessionUser?.id || session?.user?.id || "",
      category: initialData.incident?.categoryId || "",
      status: initialData.incident?.status || "NEW",
      assigneeId: initialData.incident?.assigneeId || null,
      accessList: initialData.incident?.accessList?.map((u: any) => u.id) || [],
      reference: initialData.incident?.reference || "",
    },
  });

  const watchedCompanyId = form.watch("company");
  const watchedLocationId = form.watch("location");

  const companyName = React.useMemo(() => {
    return initialData.companies.find(c => c.id === watchedCompanyId)?.name || "";
  }, [watchedCompanyId, initialData.companies]);

  const locationName = React.useMemo(() => {
    return initialData.locations.find(l => l.id === watchedLocationId)?.name || "";
  }, [watchedLocationId, initialData.locations]);

  const watchedAssigneeId = form.watch("assigneeId");
  const assigneeName = React.useMemo(() => {
    const user = initialData.users.find(u => u.id === watchedAssigneeId) ||
      resolverUsers.find(u => u.id === watchedAssigneeId);
    const name = user?.name;
    return typeof name === "string" ? name : "PENDING_ASSIGNMENT";
  }, [watchedAssigneeId, initialData.users, resolverUsers]);

  useEffect(() => {
    if ((isEdit || isView || isCreate) && initialData.incident?.id) {
      getResolverDeptUsers(initialData.incident.id).then(setResolverUsers);
    }
  }, [initialData.incident?.id, isEdit, isView, isCreate]);

  // Auto-set status to WIP when assignee is selected
  useEffect(() => {
    const status = form.getValues("status");
    if (watchedAssigneeId && watchedAssigneeId !== "PENDING_ASSIGNMENT" && (status === "NEW" || !status)) {
      form.setValue("status", "ASSIGNED");
    }
  }, [watchedAssigneeId, form]);

  const canAssign = React.useMemo(() => {
    if (isSuperAdmin) return true;
    if (!session?.user || !resolverUsers.length) return false;
    return resolverUsers.some(u => u.id === session.user.id);
  }, [isSuperAdmin, session?.user, resolverUsers]);

  const categoryTree = React.useMemo(() => {
    const map = new Map();
    initialData.categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: any[] = [];
    map.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) parent.children.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  }, [initialData.categories]);

  const filteredCategoryTree = React.useMemo(() => {
    if (!catSearch) return categoryTree;

    const filter = (list: any[]): any[] => {
      const results: any[] = [];
      for (const cat of list) {
        const matches = cat.name.toLowerCase().includes(catSearch.toLowerCase());
        const filteredChildren = cat.children ? filter(cat.children) : [];

        if (matches || filteredChildren.length > 0) {
          results.push({
            ...cat,
            children: filteredChildren,
            _isMatch: matches,
            _forceExpand: filteredChildren.length > 0
          });
        }
      }
      return results;
    };

    return filter(categoryTree);
  }, [categoryTree, catSearch]);

  const getSelectedPath = (id: string) => {
    const path: string[] = [];
    let current = initialData.categories.find(c => c.id === id);
    while (current) {
      path.unshift(current.name);
      current = initialData.categories.find(c => c.id === current?.parentId);
    }
    return path.join(" > ");
  };

  const selectedCategoryId = form.watch("category");
  const selectedCategory = initialData.categories.find(c => c.id === selectedCategoryId);
  const template = selectedCategory?.template;

  const CategoryTreeItem = ({ category, depth = 0, onSelect }: { category: any, depth?: number, onSelect: (id: string) => void }) => {
    const hasChildren = category.children && category.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(category._forceExpand || depth < 1);

    useEffect(() => {
      if (category._forceExpand) setIsExpanded(true);
    }, [category._forceExpand]);

    return (
      <div className="flex flex-col">
        <Button
          variant="ghost"
          type="button"
          disabled={effectiveIsView}
          className={cn(
            "w-full justify-start h-auto py-2.5 rounded-none border-b border-muted/20 hover:bg-muted/30 group px-4 text-left transition-all",
            form.getValues("category") === category.id && "bg-primary/5 border-l-[3px] border-l-primary",
            category._isMatch && "bg-amber-50 dark:bg-amber-900/10"
          )}
          onClick={() => onSelect(category.id)}
        >
          <div className="flex items-center w-full gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
            {hasChildren && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="size-5 flex items-center justify-center hover:bg-muted-foreground/10 rounded cursor-pointer transition-colors"
              >
                {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </div>
            )}
            {!hasChildren && <div className="size-5" />}
            <div className="flex flex-col items-start min-w-0">
              <span className={cn(
                "text-[13px] font-semibold truncate",
                form.getValues("category") === category.id ? "text-[#0176D3]" : "text-foreground",
              )}>
                {category.name}
              </span>
            </div>
          </div>
        </Button>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {category.children.map((child: any) => (
              <CategoryTreeItem key={child.id} category={child} depth={depth + 1} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Ensure data is plain objects only
      const cleanTemplateData = templateData ? JSON.parse(JSON.stringify(templateData)) : [];
      const cleanAttachments = attachments ? JSON.parse(JSON.stringify(attachments)) : [];

      const payload = {
        ...values,
        attachments: cleanAttachments,
        templateData: cleanTemplateData
      };
      if (isCreate) {
        await createIncident(payload);
        toast.success("Incident reported successfully");
        router.push("/incidents");
      } else if (isEdit) {
        await updateIncident(initialData.incident.id, payload);
        toast.success("Incident updated successfully");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim() || comment === "<p></p>") return;
    setIsAddingComment(true);
    try {
      await addComment(initialData.incident.id, comment, commentAttachments);
      setComment("");
      setCommentAttachments([]);
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAssign = async (assigneeId?: string) => {
    setIsAssigning(true);
    try {
      await assignIncident(initialData.incident.id, assigneeId);
      toast.success(assigneeId ? "Incident assigned" : "Incident assigned to you");
      form.setValue("status", "ASSIGNED");
      if (assigneeId) form.setValue("assigneeId", assigneeId);
      else form.setValue("assigneeId", session?.user?.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isComment = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const isDuplicate = attachments.some(a => a.name === files[i].name && a.fileSize === files[i].size) ||
          commentAttachments.some(a => a.name === files[i].name && a.fileSize === files[i].size);
        if (isDuplicate) {
          toast.warning(`Skipped duplicate file: ${files[i].name}`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", files[i]);
        const uploaded = await uploadFile(formData);
        if (uploaded) newAttachments.push(uploaded);
      }
      if (isComment) setCommentAttachments([...commentAttachments, ...newAttachments]);
      else setAttachments([...attachments, ...newAttachments]);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredLogs = React.useMemo(() => {
    let logs = initialData.incident?.logs || [];
    if (logStartDate) logs = logs.filter((l: any) => new Date(l.createdAt) >= new Date(logStartDate));
    if (logEndDate) {
      const end = new Date(logEndDate);
      end.setHours(23, 59, 59, 999);
      logs = logs.filter((l: any) => new Date(l.createdAt) <= end);
    }
    return logs;
  }, [initialData.incident?.logs, logStartDate, logEndDate]);

  return (
    <div className="flex flex-col h-screen bg-[#F3F2F2] dark:bg-black">

      <div className="flex-1 flex flex-col">
        {/* APPROVAL BANNER */}
        {(isPendingBusiness || isPendingOperational) && canApproveCurrentStage && (
          <div className={cn(
            "px-6 py-3 border-b flex items-center justify-between animate-in slide-in-from-top duration-500",
            isPendingBusiness ? "bg-amber-50 border-amber-200" : "bg-orange-50 border-orange-200"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-8 rounded-full flex items-center justify-center",
                isPendingBusiness ? "bg-amber-500 text-white" : "bg-orange-500 text-white"
              )}>
                <ShieldCheck className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">
                  {isPendingBusiness ? "Pending Business Approval" : "Pending Operational Approval"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPendingBusiness
                    ? "This incident requires review from the raiser's side before it reaches the technical team."
                    : "The technical solution requires operational sign-off before proceeding."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    await approveIncident(incident.id, isPendingBusiness ? "BUSINESS" : "OPERATIONAL");
                    toast.success("Approval granted successfully");
                    router.refresh();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
                className={cn(
                  "h-8 px-6 font-bold text-xs text-white rounded-sm shadow-sm",
                  isPendingBusiness ? "bg-amber-600 hover:bg-amber-700" : "bg-orange-600 hover:bg-orange-700"
                )}
              >
                <Check className="size-3.5 mr-1.5" /> Approve
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const reason = prompt("Reason for rejection:");
                  if (reason) {
                    try {
                      await rejectIncident(incident.id, isPendingBusiness ? "BUSINESS" : "OPERATIONAL", reason);
                      toast.success("Incident rejected");
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }
                }}
                className="h-8 px-4 font-bold text-xs border-muted-foreground/30 bg-white hover:bg-muted rounded-sm shadow-sm"
              >
                Reject
              </Button>
            </div>
          </div>
        )}
        {/* HIGHLIGHTS BAR */}
        {(isView || isEdit) && initialData.incident && (
          <div className="bg-[#EBF5FF] dark:bg-[#002D5C]/30 border-b px-6 py-3 flex items-center gap-8 overflow-x-auto no-scrollbar shadow-[0_4px_12px_rgba(0,0,0,0.08)] sticky top-0 z-30">
            {isActionLocked && (
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-sm mr-4 animate-pulse">
                <ShieldAlert className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Locked for Review</span>
              </div>
            )}

            <div className="w-[276px] flex items-center gap-3">
              <div className="size-7 bg-[#0176D3] rounded flex items-center justify-center">
                <AlertCircle className="size-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Incident ID</span>
                <Link href={`/incidents/${initialData.incident.id}`} className="hover:underline decoration-[#0176D3]/30 underline-offset-2">
                  <span className="text-sm font-bold text-[#0176D3]">
                    {initialData.incident?.ticketId || "N/A"}
                  </span>
                </Link>
              </div>
            </div>

            <div className="w-[180px] flex items-center gap-3 border-l pl-6 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Reference</span>
                <span className="text-sm font-bold text-foreground truncate">
                  {initialData.incident?.reference || "None"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col min-w-max">
                <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Status</span>
                {isEdit && !effectiveIsView ? (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        disabled={isPendingOperational}
                        onValueChange={field.onChange}
                        value={field.value || "NEW"}
                      >
                        <SelectTrigger className={cn(
                          "h-7 min-w-[200px] text-[10px] font-bold uppercase tracking-wider rounded-sm border-none shadow-sm transition-all",
                          STATUS_COLOR_MAP[field.value || "NEW"],
                          isPendingOperational && "opacity-50 cursor-not-allowed"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(Object.values(STATUS_MAP))).map((label) => {
                            const val = Object.entries(STATUS_MAP).find(([_, l]) => l === label)?.[0];
                            return (
                              <SelectItem key={val} value={val || ""} className="text-[10px] font-bold uppercase tracking-wider">{label}</SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Badge className={cn("rounded-sm px-2 py-0 text-[10px] font-bold uppercase tracking-wider", STATUS_COLOR_MAP[form.getValues("status") || "NEW"])}>
                    {STATUS_MAP[form.getValues("status") || "NEW"]}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col min-w-max">
                <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Priority</span>
                {isEdit && !effectiveIsView ? (
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Select
                        disabled={isPendingOperational}
                        onValueChange={field.onChange}
                        value={field.value || "MEDIUM"}
                      >
                        <SelectTrigger className={cn(
                          "h-7 min-w-[120px] text-[10px] font-bold uppercase tracking-wider bg-white border-[#0176D3]/20 focus:ring-0 rounded-sm",
                          isPendingOperational && "opacity-50 cursor-not-allowed"
                        )}>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("size-2 rounded-full",
                              field.value === "CRITICAL" ? "bg-red-500" :
                                field.value === "HIGH" ? "bg-orange-500" :
                                  field.value === "MEDIUM" ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_MAP).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-[10px] font-bold uppercase tracking-wider">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className={cn("size-2 rounded-full",
                      form.getValues("priority") === "CRITICAL" ? "bg-red-500" :
                        form.getValues("priority") === "HIGH" ? "bg-orange-500" :
                          form.getValues("priority") === "MEDIUM" ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <span className="text-sm font-semibold text-foreground">{PRIORITY_MAP[form.getValues("priority")]}</span>
                  </div>
                )}
              </div>


              <div className="flex flex-col min-w-max">
                <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Assignee</span>
                {isEdit && !effectiveIsView ? (
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <Select
                        disabled={isPendingOperational}
                        onValueChange={field.onChange}
                        value={field.value || "PENDING_ASSIGNMENT"}
                      >
                        <SelectTrigger className={cn(
                          "h-7 min-w-[150px] text-[10px] font-bold uppercase tracking-wider bg-white border-[#0176D3]/20 focus:ring-0 rounded-sm",
                          isPendingOperational && "opacity-50 cursor-not-allowed"
                        )}>
                          <div className="truncate">
                            {field.value && field.value !== "PENDING_ASSIGNMENT" ? (
                              resolverUsers.find(u => u.id === field.value)?.name ||
                              initialData.users.find(u => u.id === field.value)?.name ||
                              assigneeName ||
                              field.value
                            ) : (
                              "Pending Assignment..."
                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING_ASSIGNMENT" className="text-[10px] font-bold uppercase tracking-wider italic">Pending Assignment</SelectItem>
                          {resolverUsers.map(u => (
                            <SelectItem key={u.id} value={u.id} className="text-[10px] font-bold uppercase tracking-wider">{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <span className="text-sm font-medium text-foreground">{assigneeName}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col min-w-max ml-auto text-right">
              <span className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-bold">Created Date</span>
              <span className="text-sm font-medium text-foreground/70 tabular-nums">
                {new Date(initialData.incident.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-[#0176D3]/10">
              {effectiveIsView ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 font-bold text-[10px] uppercase tracking-widest text-[#0176D3] hover:bg-white/50">
                    <ChevronLeft className="size-4 mr-1" /> Back
                  </Button>
                  {isView && (isSuperAdmin || ((isAssignee || isResolverForCategory) && !isRestrictedRaiser && !isPendingOperational)) && (
                    <Button onClick={() => router.push(`/incidents/${initialData.incident.id}/edit`)} size="sm" className="h-8 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-[10px] uppercase tracking-widest px-4 rounded-sm shadow-sm">
                      <Edit className="size-3.5 mr-1.5" /> Edit
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-white/50">
                  <ChevronLeft className="size-4 mr-1" /> Back
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex bg-[#F3F2F2] dark:bg-black/50">
          <Form {...form}>
            <form className="flex-1 flex overflow-hidden">
              {/* LEFT COLUMN: REPORTER INFO */}
              <div className="w-[300px] border-r bg-white/60 dark:bg-muted/10 p-6 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <User className="size-4 text-[#0176D3]" />
                    <h3 className="text-sm font-semibold">Reporter Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">REPORTER NAME</label>
                      <p className="text-sm font-medium">{initialData.users.find(u => u.id === form.getValues("reporterId"))?.name || "System"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">DEPARTMENT</label>
                      <p className="text-sm font-medium">{(initialData.users.find(u => u.id === form.getValues("reporterId"))?.department as any)?.name || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">CONTACT</label>
                      <p className="text-sm font-medium">{initialData.users.find(u => u.id === form.getValues("reporterId"))?.email || "N/A"}</p>
                    </div>
                  </div>

                  {/* COMPANY & WORKSTATION (BACK TO SIDEBAR) */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">COMPANY</label>
                      <p className="text-sm font-medium">{companyName || "N/A"}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">WORKSTATION</label>
                      <p className="text-sm font-medium">{locationName || initialData.incident?.location?.name || "N/A"}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* MIDDLE COLUMN: INCIDENT SECTION */}
              <div className="flex-1 p-6 overflow-y-auto space-y-8 bg-white dark:bg-[#1A1A1A] pb-32">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="size-4 text-[#0176D3]" />
                    <h3 className="text-sm font-semibold">Incident Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-1 col-span-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-tight">CATEGORY</FormLabel>
                            {template && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setTemplateDialogOpen(true)}
                                className={cn(
                                  "h-7 text-[10px] font-bold gap-2 px-3 rounded-none uppercase tracking-widest border-2 transition-all shadow-sm",
                                  templateData.length > 0
                                    ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                                    : "text-[#0176D3] border-[#0176D3]/20 bg-[#0176D3]/5 hover:bg-[#0176D3]/10"
                                )}
                              >
                                <FileSpreadsheet className="size-3.5" />
                                {templateData.length > 0 ? `${templateData.length} Records Captured` : `Required: ${template.name} Worksheet`}
                              </Button>
                            )}
                          </div>
                          <Popover open={catOpen} onOpenChange={setCatOpen}>
                            <FormControl>
                              <PopoverTrigger disabled={effectiveIsView} className={cn("flex items-center h-8 border-b w-full text-sm font-medium bg-transparent px-0 transition-all text-left", !field.value && "text-muted-foreground", isView && "border-transparent cursor-default")}>
                                <span className="flex-1 truncate">{field.value ? getSelectedPath(field.value) : "Search and select category..."}</span>
                                {!effectiveIsView && <ChevronDown className="ml-2 h-3 w-3 opacity-50" />}
                              </PopoverTrigger>
                            </FormControl>
                            <PopoverContent className="p-0 rounded-none border shadow-xl w-[400px]" align="start">
                              <div className="flex flex-col max-h-[400px]">
                                <div className="p-3 border-b bg-muted/5">
                                  <Input placeholder="Filter categories..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} className="h-9 text-sm rounded-none border focus:ring-0 focus:border-[#0176D3]" />
                                </div>
                                <div className="overflow-y-auto bg-white dark:bg-black">
                                  {filteredCategoryTree.map(root => (
                                    <CategoryTreeItem key={root.id} category={root} onSelect={(id) => { form.setValue("category", id); setCatOpen(false); }} />
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-tight">External Reference</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PO/CSP/SO/PR etc."
                              readOnly={effectiveIsView}
                              {...field}
                              value={field.value || ""}
                              className={cn(
                                "h-8 bg-transparent px-0 border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all text-[13px] font-semibold",
                                isView && "border-transparent cursor-default"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-bold text-[#0176D3] uppercase tracking-wider">INCIDENT TITLE</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What's the issue?"
                            readOnly={effectiveIsView}
                            {...field}
                            className={cn(
                              "h-10 text-lg font-bold bg-transparent px-0 border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all placeholder:text-muted-foreground/30",
                              isView && "border-transparent cursor-default"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1 pt-4">
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-tight">TECHNICAL DESCRIPTION</FormLabel>
                        <FormControl>
                          <Editor readOnly={effectiveIsView} content={field.value} onChange={field.onChange} placeholder="Describe the issue in detail..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-6 border-t">
                    {/* ATTACHMENTS (LEFT) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2 h-10">
                        <div className="flex items-center gap-2">
                          <Paperclip className="size-4 text-[#0176D3]" />
                          <span className="text-sm font-bold uppercase tracking-wider">ATTACHMENTS</span>
                        </div>
                        {!effectiveIsView && (
                          <div className="relative">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-[#0176D3] font-semibold">
                              <Plus className="size-4 mr-1.5" /> Upload Files
                            </Button>
                          </div>
                        )}
                      </div>
                      {attachments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/10 group hover:border-[#0176D3]/30 transition-all h-10">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileIcon className="size-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs font-medium truncate">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={file.url} target="_blank" className="p-1 hover:text-[#0176D3]"><Download className="size-3.5" /></a>
                                {!effectiveIsView && (
                                  <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="p-1 hover:text-red-600"><X className="size-3.5" /></button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-muted-foreground h-14 flex items-center justify-center border border-dashed rounded bg-muted/5 uppercase tracking-widest">No files attached</p>
                      )}
                    </div>

                    {/* ACCESS LIST (RIGHT) */}
                    <FormField
                      control={form.control}
                      name="accessList"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2 h-10">
                            <div className="flex items-center gap-2">
                              <Users className="size-4 text-[#0176D3]" />
                              <span className="text-sm font-bold uppercase tracking-wider">ACCESS LIST</span>
                            </div>
                          </div>
                          <FormControl>
                            <UserTagInput
                              users={initialData.users}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={effectiveIsView}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  {!effectiveIsView && (
                    <div className="pt-8 flex items-center justify-end gap-3">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                        className="h-10 font-bold text-xs px-8 uppercase tracking-widest hover:bg-muted"
                      >
                        Cancel Request
                      </Button>
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="h-10 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-xs px-10 uppercase tracking-widest shadow-lg shadow-blue-500/20"
                      >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : (isEdit ? "Update" : "Submit Incident")}
                      </Button>
                    </div>
                  )}
                  <div className="h-40" />
                </div>
              </div>

              {/* RIGHT COLUMN: COMMENTS & AUDIT TRAIL (HIDE IN CREATE MODE) */}
              {!isCreate && (
                <div className="w-[450px] border-l bg-[#F1F3F5] dark:bg-black/20 flex flex-col overflow-hidden">
                  <Tabs defaultValue="comments" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 bg-white dark:bg-[#1A1A1A] border-b">
                      <TabsList className="h-12 w-full bg-transparent p-0 gap-8 justify-start rounded-none border-none">
                        <TabsTrigger value="comments" className="h-full rounded-none border-x-0 border-t-0 border-b-2 border-transparent data-[state=active]:border-[#0176D3] data-[state=active]:bg-transparent data-[state=active]:text-[#0176D3] text-xs font-bold uppercase tracking-widest px-0 transition-all">
                          Comments
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="h-full rounded-none border-x-0 border-t-0 border-b-2 border-transparent data-[state=active]:border-[#0176D3] data-[state=active]:bg-transparent data-[state=active]:text-[#0176D3] text-xs font-bold uppercase tracking-widest px-0 transition-all">
                          Audit Trail
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="comments" className="flex-1 overflow-y-auto p-4 space-y-6 m-0 pb-32">
                      {/* COMMENT BOX */}
                      <div className="bg-white dark:bg-[#1A1A1A] p-5 border rounded-none shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#0176D3] uppercase tracking-widest">
                          <MessageSquarePlus className="size-3.5" />
                          Post an update
                        </div>
                        <div className="border bg-white dark:bg-black">
                          <Editor content={comment} onChange={setComment} placeholder="Write a comment or update..." />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-2 flex-1">
                            {commentAttachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pb-2">
                                {commentAttachments.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-[#0176D3]">
                                    <FileIcon className="size-3" />
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                    <button type="button" onClick={() => setCommentAttachments(commentAttachments.filter((_, i) => i !== idx))} className="hover:text-red-500">
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="relative">
                              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, true)} />
                              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-[#0176D3] p-0"><Paperclip className="size-3.5 mr-1.5" /> Attach Files</Button>
                            </div>
                          </div>
                          <Button onClick={handleAddComment} disabled={isAddingComment || (!comment.trim() || comment === "<p></p>") && commentAttachments.length === 0} size="sm" className="h-8 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-xs px-6 uppercase tracking-widest self-end">
                            Post
                          </Button>
                        </div>
                      </div>

                      {/* COMMENTS FEED */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Recent Conversations</h4>
                        <div className="space-y-3">
                          {filteredLogs.filter((l: any) => l.type === "COMMENT" || l.content?.includes("<p>")).map((log: any) => (
                            <div key={log.id} className="bg-white dark:bg-[#1A1A1A] border rounded-none p-4 space-y-3 relative group shadow-sm">
                              <div className="flex items-start gap-3">
                                <div className="size-8 rounded-none bg-[#0176D3] flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
                                  {log.user.name?.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#0176D3]">{log.user.name}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="max-w-none text-[13px] leading-relaxed font-normal text-foreground/90 mt-2" dangerouslySetInnerHTML={{ __html: log.content }} />

                                  {log.attachments?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {log.attachments.map((file: any, idx: number) => (
                                        <a key={idx} href={file.url} target="_blank" className="flex items-center gap-2 p-1.5 rounded bg-muted/50 border border-border hover:border-[#0176D3] transition-all group">
                                          <FileIcon className="size-3 text-muted-foreground group-hover:text-[#0176D3]" />
                                          <span className="text-[10px] font-medium truncate max-w-[120px]">{file.name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="audit" className="flex-1 overflow-y-auto p-4 space-y-6 m-0 pb-32">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Activity</h4>
                          <div className="relative w-48">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50" />
                            <Input placeholder="Search logs..." className="h-8 pl-8 text-[10px] rounded-none bg-white border" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {filteredLogs.map((log: any) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 border-b last:border-0 border-muted/30 hover:bg-white/50 transition-colors">
                              <div className={cn(
                                "mt-1 size-2 rounded-full flex-shrink-0",
                                log.action === "COMMENT" ? "bg-blue-500" :
                                  log.action === "STATUS_CHANGE" ? "bg-orange-500" :
                                    log.action === "ASSIGNMENT" ? "bg-purple-500" : "bg-muted-foreground/30"
                              )} />
                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-foreground">{log.user.name}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded">
                                      {log.action.replace("_", " ")}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: log.content }} />
                                {log.attachments?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {log.attachments.map((file: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-border rounded text-[9px] font-bold text-muted-foreground">
                                        <Paperclip className="size-2.5" />
                                        <span>{file.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>

      {template && (
        <TemplateGridDialog
          isOpen={templateDialogOpen}
          setIsOpen={setTemplateDialogOpen}
          template={template}
          data={templateData}
          onSave={setTemplateData}
          isReadOnly={effectiveIsView}
        />
      )}
    </div>
  );
}
