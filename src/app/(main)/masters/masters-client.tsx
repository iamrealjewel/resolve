"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, Tag, GitBranch, Trash2, ArrowRight, ChevronRight, ChevronDown, FolderTree, Layers, ShieldCheck, Users, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { CategoryDialog, InfrastructureDialog, RoutingRuleDialog, DataTemplateDialog } from "@/components/master-dialogs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CompanyCRUD, DeleteCompanyButton } from "@/components/org-crud";
import {
  deleteCategory,
  deleteDepartment,
  deleteLocation,
  deleteRoutingRule,
  deleteDesignation,
  deleteDataTemplate
} from "@/app/actions/master";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  requiresRaiserApproval?: boolean;
  requiresResolverApproval?: boolean;
  approvers?: any[];
  children?: Category[];
}

function CategoryTreeNode({ category, categories, users, templates, rules, depth = 0 }: { category: Category, categories: any[], users: any[], templates: any[], rules: any[], depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const categoryRules = rules.filter(r => r.categoryId === category.id);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex flex-col border-b hover:bg-[#0176D3]/10 hover:border-l-4 hover:border-l-[#0176D3] transition-all group relative",
          depth > 0 && "bg-muted/5"
        )}
      >
        <div className="flex items-center gap-2 py-0.5 pr-6">
          {Array.from({ length: depth }).map((_, i) => (
            <div key={i} className="absolute h-full border-l border-muted-foreground/20 border-dashed" style={{ left: `${i * 24 + 12}px` }} />
          ))}
          <div className="flex items-center gap-2 flex-1 relative" style={{ paddingLeft: `${depth * 24 + 8}px` }}>
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-muted-foreground hover:text-foreground transition-none"
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              ) : (
                <div className="size-4" />
              )}
              <div className="size-2 shrink-0 bg-[#0176D3]/40 rounded-full" />
              <div className="flex items-center gap-4 flex-1">
                <span className={cn(
                  "text-[13px] font-semibold tracking-tight whitespace-nowrap",
                  depth === 0 ? "text-foreground" : "text-foreground/80"
                )}>
                  {category.name}
                </span>

                {/* Workflow Summary in Tree - Now Side by Side */}
                <div className="flex items-center gap-2">
                  {/* Routing Rule Info */}
                  {categoryRules.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[#0176D3] uppercase tracking-wider bg-[#0176D3]/5 px-1.5 py-0.5 rounded-sm border border-[#0176D3]/10 whitespace-nowrap">
                      <GitBranch className="size-2.5" />
                      {categoryRules[0].department?.name || "N/A"}
                    </div>
                  )}

                  {/* Approval Matrix Indicators */}
                  <div className="flex items-center gap-1">
                    {category.requiresRaiserApproval && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-[9px] font-medium text-amber-600 border border-amber-200 rounded-sm leading-none whitespace-nowrap" title="Business Approval Required">
                        <ShieldCheck className="size-2.5" />
                        BA
                        {category.approvers?.some(a => a.type === "RAISER") && <span className="ml-1 text-[7px] px-1 bg-amber-600 text-white rounded-[1px]">OVR</span>}
                      </div>
                    )}
                    {category.requiresResolverApproval && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-[9px] font-medium text-orange-600 border border-orange-200 rounded-sm leading-none whitespace-nowrap" title="Operational Approval Required">
                        <ShieldCheck className="size-2.5" />
                        OA
                        {category.approvers?.some(a => a.type === "RESOLVER") && <span className="ml-1 text-[7px] px-1 bg-orange-600 text-white rounded-[1px]">OVR</span>}
                      </div>
                    )}
                  </div>

                  {/* Override Approvers - Side by Side */}
                  {category.approvers && category.approvers.length > 0 && (
                    <div className="flex items-center gap-1.5 border-l border-muted-foreground/20 pl-2 ml-1">
                      {category.approvers.map((ap: any) => ap.user && (
                        <div key={ap.id} className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/40 border border-muted-foreground/10 rounded-full " title={`${ap.type === "RAISER" ? "Business" : "Operational"} Approver Override: ${ap.user.name}`}>
                          <Users className="size-3 text-muted-foreground" />
                          <span className="text-[12px] font-semibold text-foreground/70">{ap.user.name}</span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[4px] leading-none",
                            ap.type === "RAISER" ? "bg-amber-600 text-white" : "bg-orange-600 text-white"
                          )}>
                            {ap.type === "RAISER" ? "BA" : "OA"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Template Info - Moved to last */}
                  {(category as any).template && (
                    <div className="flex items-center gap-1 text-[9px] font-medium text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-200 whitespace-nowrap" title={`Template: ${(category as any).template.name}`}>
                      <FolderTree className="size-2.5" />
                      <span className="opacity-60 mr-0.5">Template:</span>
                      {(category as any).template.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <CategoryDialog categories={categories} users={users} templates={templates} defaultParentId={category.id} />
              <CategoryDialog categories={categories} users={users} templates={templates} item={category} />
              <ConfirmDialog
                title="Delete Category?"
                description={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
                onConfirm={async () => await deleteCategory(category.id)}
                trigger={
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {category.children?.map(child => (
            <CategoryTreeNode key={child.id} category={child} categories={categories} users={users} templates={templates} rules={rules} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentTreeNode({ department, allDepartments, companies, depth = 0 }: { department: any, allDepartments: any[], companies: any[], depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allDepartments.filter(d => d.parentId === department.id);
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center justify-between py-0.5 border-b hover:bg-[#0176D3]/10 hover:border-l-4 hover:border-l-[#0176D3] transition-all group relative",
          depth > 0 && "bg-muted/5"
        )}
      >
        {Array.from({ length: depth }).map((_, i) => (
          <div key={i} className="absolute h-full border-l border-muted-foreground/20 border-dashed" style={{ left: `${i * 24 + 12}px` }} />
        ))}
        <div className="flex items-center justify-between gap-2 flex-1 relative" style={{ paddingLeft: `${depth * 24 + 8}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground transition-none"
              >
                {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            ) : (
              <div className="size-3.5" />
            )}
            <div className="size-2 shrink-0 bg-[#0176D3]/40 rounded-full" />
            <div className="flex flex-col">
              <span className="font-medium text-[13px] leading-tight">{department.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 pr-4">
            <InfrastructureDialog type="department" companies={companies} departments={allDepartments} defaultParentId={department.id} />
            <InfrastructureDialog type="department" item={department} companies={companies} departments={allDepartments} />
            <ConfirmDialog
              title="Delete Department?"
              description={`Are you sure you want to delete "${department.name}"? This action cannot be undone.`}
              onConfirm={async () => await deleteDepartment(department.id)}
              trigger={
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {children.map((child: any) => (
            <DepartmentTreeNode key={child.id} department={child} allDepartments={allDepartments} companies={companies} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MastersClient({ data }: { data: any }) {
  const { categories, departments, locations, companies, rules, users, designations, templates } = data;

  // Helper to build recursive tree
  const buildTree = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  const rootCategories = buildTree(categories);
  const rootDepartments = buildTree(departments);

  return (
    <div className="space-y-0 h-full flex flex-col px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2 border-b">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Master Data Registry</h2>
          <p className="text-[10px] font-bold text-[#0176D3] uppercase tracking-wider">
            Infrastructure Configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="companies" className="flex-1 flex flex-col">
        <div className="border-b bg-background sticky top-0 z-10">
          <TabsList variant="line" className="h-14 bg-transparent p-0 gap-0 justify-start rounded-none border-none">
            <TabsTrigger
              value="companies"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Building2 className="size-3.5" /> Companies
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Users className="size-3.5" /> Org Units
            </TabsTrigger>
            <TabsTrigger
              value="designations"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Tag className="size-3.5" /> Designations
            </TabsTrigger>
            <TabsTrigger
              value="classifications"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <GitBranch className="size-3.5" /> Service Tree
            </TabsTrigger>
            <TabsTrigger
              value="routing"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowRight className="size-3.5" /> Routing
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="h-14 px-5 rounded-none border-0 border-b-2 border-b-transparent data-active:border-b-primary data-active:text-primary data-active:bg-primary/5 transition-none flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Layers className="size-3" /> Templates
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <TabsContent value="companies" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold">Legal Entities</h3>
                <p className="text-sm text-muted-foreground">Manage registered companies and subsidiaries.</p>
              </div>
              <CompanyCRUD />
            </div>
            <Card className="border shadow-none rounded-sm overflow-hidden bg-white dark:bg-[#1A1A1A]">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground pl-6 h-12">Entity Name</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground h-12">User Pool</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground h-12">Incidents</TableHead>
                    <TableHead className="w-[100px] h-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company: any) => (
                    <TableRow key={company.id} className="group hover:bg-[#0176D3]/10 transition-all">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-muted/50 flex items-center justify-center border rounded-sm">
                            <Building2 className="size-4 text-[#0176D3]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-[#0176D3] transition-colors">{company.name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">ID: {company.id.split('-').pop()?.toUpperCase()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-[#0176D3]/40" />
                          <span className="text-sm font-bold">{company._count?.users || 0} Users</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="size-4 text-[#0176D3]/40" />
                          <span className="text-sm font-bold">{company._count?.incidents || 0} Open Cases</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeleteCompanyButton id={company.id} />
                          <Link
                            href={`/masters/companies/${company.id}`}
                            className="text-muted-foreground hover:text-[#0176D3] h-8 w-8 flex items-center justify-center"
                          >
                            <ChevronRight className="size-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="organization" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Departments Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold">Internal Hierarchy</h3>
                    <p className="text-sm text-muted-foreground">Manage departmental structure.</p>
                  </div>
                  <InfrastructureDialog type="department" departments={departments} />
                </div>
                <Card className="border shadow-none overflow-hidden rounded-none">
                  <div className="bg-muted/50 border-b px-6 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departmental Nodes</span>
                  </div>
                  <div className="divide-y">
                    {departments.filter((d: any) => !d.parentId).map((dept: any) => (
                      <DepartmentTreeNode key={dept.id} department={dept} allDepartments={departments} companies={companies} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* Locations Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold">Operational Sites</h3>
                    <p className="text-sm text-muted-foreground">Register physical or logical service locations.</p>
                  </div>
                  <InfrastructureDialog type="location" />
                </div>
                <Card className="border shadow-none overflow-hidden rounded-none">
                  <Table>
                    <TableBody>
                      {locations.map((loc: any) => (
                        <TableRow key={loc.id} className="hover:bg-[#0176D3]/10 transition-all">
                          <TableCell className="font-medium text-xs pl-6 py-1.5">{loc.name}</TableCell>
                          <TableCell className="text-right pr-6 py-1.5">
                            <div className="flex items-center justify-end gap-1">
                              <InfrastructureDialog type="location" item={loc} />
                              <ConfirmDialog
                                title="Delete Location?"
                                description="Are you sure you want to delete this location? This action cannot be undone."
                                onConfirm={async () => await deleteLocation(loc.id)}
                                trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="size-4" /></Button>}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="designations" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold">Official Designations</h3>
                <p className="text-sm text-muted-foreground">Manage organizational titles and departmental roles.</p>
              </div>
              <InfrastructureDialog type="designation" departments={departments} />
            </div>

            <Card className="border shadow-none overflow-hidden rounded-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground pl-6">Title</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.length > 0 ? (
                    designations.map((d: any) => (
                      <TableRow key={d.id} className="group hover:bg-[#0176D3]/10 transition-all">
                        <TableCell className="pl-6 py-0.5">
                          <span className="text-xs font-medium">{d.title}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <InfrastructureDialog type="designation" item={d} />
                            <ConfirmDialog
                              title="Delete Designation?"
                              description="Are you sure you want to delete this designation? This action cannot be undone."
                              onConfirm={async () => await deleteDesignation(d.id)}
                              trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="size-4" /></Button>}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        No designations registered
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="classifications" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold">Category Hierarchy</h3>
                <p className="text-sm text-muted-foreground">Define hierarchical incident classifications for automated resolution.</p>
              </div>
              <CategoryDialog categories={categories} users={users} templates={templates} />
            </div>

            <Card className="border shadow-none overflow-hidden rounded-none">
              <div className="divide-y divide-border/50 border rounded-none">
                {rootCategories.map((cat: any) => (
                  <CategoryTreeNode key={cat.id} category={cat} categories={categories} users={users} templates={templates} rules={rules} />
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="routing" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold">Workflow Automation</h3>
                <p className="text-sm text-muted-foreground">Map classifications to specific functional resolver units.</p>
              </div>
              <RoutingRuleDialog categories={categories} departments={departments} users={users} />
            </div>

            <Card className="border shadow-none overflow-hidden rounded-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground pl-6">Incident Domain</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-foreground">Assigned Unit</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: any) => (
                    <TableRow key={rule.id} className="group hover:bg-[#0176D3]/10 transition-all">
                      <TableCell className="pl-6 py-1.5">
                        <div className="flex items-center gap-3">
                          <div className="size-7 bg-muted flex items-center justify-center border">
                            <Tag className="size-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-medium">{rule.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GitBranch className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{rule.department.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <RoutingRuleDialog categories={categories} departments={departments} users={users} item={rule} />
                          <ConfirmDialog
                            title="Delete Routing Rule?"
                            description="Are you sure you want to delete this routing rule? This action cannot be undone."
                            onConfirm={async () => await deleteRoutingRule(rule.id)}
                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="size-4" /></Button>}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="m-0 space-y-4 focus-visible:outline-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold">Data Templates</h3>
                <p className="text-sm text-muted-foreground">Define worksheet schemas for specialized request types.</p>
              </div>
              <DataTemplateDialog />
            </div>
            <Card className="border shadow-none overflow-hidden rounded-none">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Template Name</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Fields (Columns)</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Description</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10 w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates?.map((template: any) => (
                        <TableRow key={template.id} className="hover:bg-[#0176D3]/10 transition-all">
                          <TableCell className="py-3 font-bold text-[13px]">{template.name}</TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {template.fields?.map((f: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[9px] font-bold py-0 h-5 px-1.5 uppercase tracking-tight bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {f.name} ({f.type})
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground italic">
                            {template.description || "No description provided"}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DataTemplateDialog item={template} />
                              <ConfirmDialog
                                title="Delete Template"
                                description="Are you sure you want to delete this template? Any categories using it will lose their template requirement."
                                onConfirm={async () => {
                                  await deleteDataTemplate(template.id);
                                  toast.success("Template deleted successfully");
                                }}
                                trigger={
                                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="size-4" />
                                  </Button>
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!templates || templates.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs italic">
                            No data templates defined yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
import { toast } from "sonner";
