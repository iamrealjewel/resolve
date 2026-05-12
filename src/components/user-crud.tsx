"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/app/actions/master";
import { useConfirm } from "@/components/confirm-dialog";

export function DeleteUserButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Decommission Identity?",
      message: "This will permanently revoke all system access for this user. This action is irreversible.",
      variant: "destructive",
      confirmText: "Revoke Access"
    });

    if (!ok) return;

    setIsDeleting(true);
    try {
      await deleteUser(id);
      toast.success("Identity decommissioned successfully");
    } catch (error) {
      toast.error("Failed to revoke access. User may have active assigned incidents.");
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
      className="text-slate-300 hover:text-red-500 transition-colors"
    >
      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
