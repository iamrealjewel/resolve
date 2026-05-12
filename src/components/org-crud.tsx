"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createCompany, deleteCompany } from "@/app/actions/master";
import { useConfirm } from "@/components/confirm-dialog";

export function CompanyCRUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");

  async function handleAdd() {
    if (!name) return toast.error("Name is required");
    setIsSubmitting(true);
    try {
      await createCompany({ name });
      toast.success("Company registered successfully");
      setIsOpen(false);
      setName("");
    } catch (error) {
      toast.error("Failed to register company");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 px-4 rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-xs">
          <Plus className="mr-2 size-4" /> Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border shadow-none bg-background p-0 overflow-hidden rounded-sm">
        <DialogHeader className="p-5 bg-muted/10 border-b flex flex-row items-center gap-4">
          <div className="size-9 bg-[#0176D3] rounded flex items-center justify-center">
             <Building2 className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <DialogTitle className="text-base font-semibold text-foreground leading-none mb-1">Entity Registration</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Add a new legal entity to the group hierarchy</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-6 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Legal Enterprise Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Ispahani Logistics Ltd." 
              className="h-9 bg-transparent rounded-sm border font-medium text-sm w-full px-3 focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6 border-t bg-muted/10">
          <Button 
            onClick={handleAdd} 
            disabled={isSubmitting}
            className="w-full h-10 font-semibold text-sm rounded-sm bg-[#0176D3] hover:bg-[#014486] text-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Building2 className="size-4 mr-2" />}
            Confirm Registration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCompanyButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Company?",
      message: "This will permanently remove the company entity. Global infrastructure (Departments & Locations) will not be affected. This action cannot be undone.",
      variant: "destructive",
      confirmText: "Delete Entity"
    });
    
    if (!ok) return;
    setIsDeleting(true);
    try {
      await deleteCompany(id);
      toast.success("Company removed");
    } catch (error) {
      toast.error("Deletion failed. Company may have active incidents.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8"
    >
      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
