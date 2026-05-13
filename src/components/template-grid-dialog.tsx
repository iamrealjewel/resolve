"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Field {
  name: string;
  type: string;
  required: boolean;
}

interface Template {
  id: string;
  name: string;
  fields: Field[];
}

export function TemplateGridDialog({ 
  template,
  data,
  onSave,
  isOpen,
  setIsOpen
}: { 
  template: Template,
  data: any[],
  onSave: (data: any[]) => void,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void
}) {
  const createEmptyRow = () => {
    const row: any = {};
    template.fields.forEach(f => {
      row[f.name] = f.type === "boolean" ? false : "";
    });
    return row;
  };

  const [rows, setRows] = useState<any[]>(data.length > 0 ? data : [createEmptyRow()]);
  
  useEffect(() => {
    if (isOpen && data.length > 0) {
      setRows(data);
    } else if (isOpen && (rows.length === 0 || (rows.length === 1 && Object.keys(rows[0]).length === 0))) {
      setRows([createEmptyRow()]);
    }
  }, [isOpen, data, template]);

  const addRow = () => setRows([...rows, createEmptyRow()]);
  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows.length === 0 ? [createEmptyRow()] : newRows);
  };

  const updateCell = (rowIndex: number, fieldName: string, value: any) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [fieldName]: value };
    setRows(newRows);
  };

  const handleExport = () => {
    const headers = template.fields.map(f => f.name);
    const ws = XLSX.utils.json_to_sheet([], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${template.name}_Template.xlsx`);
    toast.success("Excel template downloaded");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const importedData = XLSX.utils.sheet_to_json(ws);

      if (importedData.length > 0) {
        // Validate headers roughly by checking if first item has any matching keys
        const firstRow = importedData[0] as any;
        const validKeys = template.fields.map(f => f.name);
        const hasMatch = Object.keys(firstRow).some(key => validKeys.includes(key));

        if (!hasMatch) {
          toast.error("Excel headers do not match the template fields");
          return;
        }

        setRows(importedData);
        toast.success(`Imported ${importedData.length} records successfully`);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = "";
  };

  const handleSave = () => {
    // Basic validation
    const cleanedRows = rows.filter(row => Object.values(row).some(v => v !== ""));
    if (cleanedRows.length === 0) {
      toast.warning("No data to save");
      return;
    }
    onSave(cleanedRows);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] w-[1300px] h-[85vh] p-0 overflow-hidden border-none rounded-none shadow-2xl flex flex-col">
        <DialogHeader className="p-6 bg-muted/30 border-b flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="size-5 text-[#0176D3]" />
              <DialogTitle className="text-lg font-bold text-foreground leading-none">
                {template.name} Worksheet
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-none">
              Capture structured data for this classification. Use the spreadsheet grid below or import from Excel.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-[10px] font-bold gap-1.5 rounded-sm">
              <Download className="size-3.5" /> DOWNLOAD TEMPLATE
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold gap-1.5 rounded-sm">
                <Upload className="size-3.5" /> IMPORT EXCEL
              </Button>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleImport}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border-b">
          <Table className="min-w-[1200px] border-collapse">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-12 text-center text-[10px] font-bold uppercase p-0 h-10">#</TableHead>
                {template.fields.map((field, idx) => (
                  <TableHead key={idx} className="min-w-[200px] border-l text-[10px] font-bold uppercase tracking-wider h-10 px-4">
                    <div className="flex items-center justify-between">
                      <span>{field.name}</span>
                      {field.required && <span className="text-destructive">*</span>}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12 border-l h-10 p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-accent/5 transition-none border-b">
                  <TableCell className="text-center text-[10px] font-bold text-muted-foreground p-0 h-10 border-r bg-muted/5">
                    {rowIndex + 1}
                  </TableCell>
                  {template.fields.map((field, fieldIdx) => (
                    <TableCell key={fieldIdx} className="p-0 h-10 border-r">
                      {field.type === "list" ? (
                        <Select 
                          value={row[field.name] || ""} 
                          onValueChange={(val) => updateCell(rowIndex, field.name, val)}
                        >
                          <SelectTrigger className="h-full w-full rounded-none border-none bg-transparent px-4 text-sm focus:ring-0 focus:border-none shadow-none">
                            <SelectValue placeholder={`Select ${field.name}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field as any).options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "boolean" ? (
                        <Select 
                          value={row[field.name]?.toString() || ""} 
                          onValueChange={(val) => updateCell(rowIndex, field.name, val === "true")}
                        >
                          <SelectTrigger className="h-full w-full rounded-none border-none bg-transparent px-4 text-sm focus:ring-0 focus:border-none shadow-none text-left">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true" className="text-xs">Yes</SelectItem>
                            <SelectItem value="false" className="text-xs">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          className="h-full w-full rounded-none border-none bg-transparent px-4 text-sm focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#0176D3] transition-none placeholder:italic placeholder:text-[11px]"
                          value={row[field.name] || ""}
                          onChange={(e) => updateCell(rowIndex, field.name, e.target.value)}
                          placeholder={`Enter ${field.name}...`}
                          type={field.type === "numeric" ? "number" : field.type === "email" ? "email" : "text"}
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="p-0 h-10 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(rowIndex)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t bg-muted/10">
          <Button onClick={addRow} variant="ghost" size="sm" className="h-8 text-[10px] font-black text-[#0176D3] gap-1.5 hover:bg-[#0176D3]/10">
            <Plus className="size-4" /> ADD ANOTHER RECORD
          </Button>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
               <CheckCircle2 className="size-3.5 text-green-600" />
               {rows.filter(r => Object.values(r).some(v => v)).length} Records Captured
             </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="h-9 text-[10px] font-bold px-6 rounded-none uppercase tracking-widest border-2">
              CANCEL
            </Button>
            <Button onClick={handleSave} className="h-9 bg-foreground text-background hover:bg-foreground/90 text-[10px] font-bold px-8 rounded-none uppercase tracking-widest min-w-[120px]">
              CONFIRM DATA
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
