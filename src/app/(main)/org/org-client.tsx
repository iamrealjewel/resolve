"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, MapPin, Users, ChevronRight, Activity, LayoutGrid, List, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { CompanyCRUD, DeleteCompanyButton } from "@/components/org-crud";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export function OrgClient({ companies }: { companies: any[] }) {
  return (
    <div className="space-y-6 pb-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Organizational Matrix</h2>
          <p className="text-[10px] font-bold text-[#0176D3] uppercase tracking-wider">
            Enterprise Management
          </p>
          <h1 className="text-lg font-bold text-foreground mt-1">Legal Entities & Resource Distribution</h1>
        </div>
        <div className="flex items-center gap-3">
          <CompanyCRUD />
        </div>
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
            {companies.map((company) => (
              <TableRow key={company.id} className="group hover:bg-muted/30 transition-none">
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
                    <span className="text-sm font-bold">{company._count.users} Users</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-[#0176D3]/40" />
                    <span className="text-sm font-bold">{company._count.incidents} Open Cases</span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteCompanyButton id={company.id} />
                    <Link 
                      href={`/org/${company.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "text-muted-foreground hover:text-[#0176D3] h-8 w-8 rounded-sm"
                      )}
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
    </div>
  );
}
