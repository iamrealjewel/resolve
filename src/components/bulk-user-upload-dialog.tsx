"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { bulkCreateUsers } from "@/app/actions/master";
import { cn } from "@/lib/utils";

interface BulkUserUploadDialogProps {
  companies: any[];
  departments: any[];
  locations: any[];
  designations: any[];
  users: any[];
}

interface ParsedRow {
  index: number;
  data: any;
  isValid: boolean;
  errors: string[];
}

export function BulkUserUploadDialog({
  companies,
  departments,
  locations,
  designations,
  users
}: BulkUserUploadDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validRows, setValidRows] = React.useState<ParsedRow[]>([]);
  const [problemRows, setProblemRows] = React.useState<ParsedRow[]>([]);
  const [activeTab, setActiveTab] = React.useState("valid");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setValidRows([]);
    setProblemRows([]);
    setIsParsing(false);
    setIsSubmitting(false);
    setActiveTab("valid");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    window.open("/api/bulk-users/template", "_blank");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        validateData(jsonData);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        toast.error("Failed to parse Excel file");
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const valid: ParsedRow[] = [];
    const problems: ParsedRow[] = [];
    const emailsInExcel = new Set();

    data.forEach((row, index) => {
      const errors: string[] = [];
      const rowData: any = {};

      // 1. Basic Field Extraction & Required Check
      const name = row["Name*"];
      const email = row["Email*"];
      const roleName = row["Role*"];
      const companyName = row["Company*"];
      const deptName = row["Department"];
      const desigName = row["Designation"];
      const locName = row["Location"];
      const phone = row["Phone"];
      const superiorEmail = row["Superior Email"];
      const password = row["Password (Optional)"];

      if (!name) errors.push("Name is required");
      if (!email) errors.push("Email is required");
      if (!roleName) errors.push("Role is required");
      if (!companyName) errors.push("Company is required");

      // 2. Email Validation
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Invalid email format");
        }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          errors.push("User with this email already exists");
        }
        if (emailsInExcel.has(email.toLowerCase())) {
          errors.push("Duplicate email in Excel");
        }
        emailsInExcel.add(email.toLowerCase());
      }

      // 3. Mapping Names to IDs
      const company = companies.find(c => c.name === companyName);
      if (companyName && !company) errors.push(`Company "${companyName}" not found`);
      else if (company) rowData.companyId = company.id;

      const department = departments.find(d => d.name === deptName);
      if (deptName && !department) errors.push(`Department "${deptName}" not found`);
      else if (department) rowData.departmentId = department.id;

      const designation = designations.find(d => d.title === desigName);
      if (desigName && !designation) errors.push(`Designation "${desigName}" not found`);
      else if (designation) rowData.designationId = designation.id;

      const location = locations.find(l => l.name === locName);
      if (locName && !location) errors.push(`Location "${locName}" not found`);
      else if (location) rowData.locationId = location.id;

      const superior = users.find(u => u.email === superiorEmail);
      if (superiorEmail && !superior) errors.push(`Superior "${superiorEmail}" not found`);
      else if (superior) rowData.superiorId = superior.id;

      // 4. Role Validation
      const validRoles = ["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER", "USER"];
      if (roleName && !validRoles.includes(roleName)) {
        errors.push(`Invalid role "${roleName}"`);
      } else {
        rowData.role = roleName;
      }

      rowData.name = name;
      rowData.email = email;
      rowData.phone = phone ? String(phone) : null;
      rowData.password = password || "password123";

      const parsedRow: ParsedRow = {
        index: index + 2, // Excel row index
        data: rowData,
        isValid: errors.length === 0,
        errors
      };

      if (parsedRow.isValid) valid.push(parsedRow);
      else problems.push(parsedRow);
    });

    setValidRows(valid);
    setProblemRows(problems);
    setIsParsing(false);
    if (problems.length > 0 && valid.length === 0) setActiveTab("problems");
  };

  const handleProceed = async () => {
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = validRows.map(r => r.data);
      await bulkCreateUsers(payload);
      toast.success(`Successfully created ${validRows.length} users`);
      setIsOpen(false);
      resetState();
    } catch (error: any) {
      toast.error(error.message || "Failed to create users");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadProblems = () => {
    if (problemRows.length === 0) return;

    const dataToExport = problemRows.map(row => ({
      "Row": row.index,
      "Name": row.data.name || "",
      "Email": row.data.email || "",
      "Errors": row.errors.join(", ")
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Problems");
    XLSX.writeFile(workbook, "Problematic_Users.xlsx");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 px-4 border-dashed gap-2">
          <Upload className="size-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[98vw] w-full max-h-[96vh] h-full flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Bulk User Creation</DialogTitle>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="h-8 gap-2 text-[#0176D3]">
              <Download className="size-4" />
              Download Template
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload an Excel file to create multiple users at once. Valid rows will be created, and problematic rows can be fixed and re-uploaded.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          {validRows.length === 0 && problemRows.length === 0 ? (
            <div
              className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center space-y-4 my-6 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {isParsing ? <Loader2 className="size-6 animate-spin" /> : <FileSpreadsheet className="size-6" />}
              </div>
              <div className="text-center">
                <p className="font-medium">{isParsing ? "Analyzing file..." : "Click or drag Excel file here"}</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .xls formats</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="valid" className="gap-2">
                      <CheckCircle2 className="size-3.5 text-green-500" />
                      Valid Rows
                      <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 hover:bg-green-100">
                        {validRows.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="problems" className="gap-2 text-rose-500 data-[state=active]:text-rose-600">
                      <AlertCircle className="size-3.5" />
                      Problems
                      <Badge variant="destructive" className="ml-1">
                        {problemRows.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {activeTab === "problems" && problemRows.length > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadProblems} className="h-8 gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                      <Download className="size-4" />
                      Export Problems
                    </Button>
                  )}
                </div>

                <TabsContent value="valid" className="flex-1 overflow-auto border rounded-md m-0">
                  {validRows.length > 0 ? (
                    <Table className="min-w-full w-max">
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[60px]">Row</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Superior</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validRows.map((row) => (
                          <TableRow key={row.index}>
                            <TableCell className="font-medium text-muted-foreground">#{row.index}</TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">{row.data.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.data.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {row.data.role.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{companies.find(c => c.id === row.data.companyId)?.name}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{departments.find(d => d.id === row.data.departmentId)?.name || "-"}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{designations.find(d => d.id === row.data.designationId)?.title || "-"}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{locations.find(l => l.id === row.data.locationId)?.name || "-"}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{row.data.phone || "-"}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{users.find(u => u.id === row.data.superiorId)?.email || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <p>No valid rows found in this file.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="problems" className="flex-1 overflow-auto border rounded-md m-0">
                  {problemRows.length > 0 ? (
                    <Table className="min-w-full w-max">
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[60px]">Row</TableHead>
                          <TableHead>Identifier</TableHead>
                          <TableHead>Error Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {problemRows.map((row) => (
                          <TableRow key={row.index} className="bg-rose-50/30">
                            <TableCell className="font-medium text-rose-700">#{row.index}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{row.data.name || "N/A"}</span>
                                <span className="text-xs text-muted-foreground">{row.data.email || "No email"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc list-inside text-xs text-rose-600 space-y-0.5">
                                {row.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-green-600">
                      <CheckCircle2 className="size-8 mb-2" />
                      <p>Great! No problems detected.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 bg-muted/20 border-t">
          <Button variant="ghost" onClick={() => resetState()} disabled={isSubmitting}>
            Reset
          </Button>
          <Button
            onClick={handleProceed}
            disabled={validRows.length === 0 || isSubmitting}
            className="bg-[#0176D3] hover:bg-[#014486] min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                Proceed with {validRows.length} Users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
