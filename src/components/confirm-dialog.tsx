"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

// --- HOOK PATTERN ---
interface ConfirmOptions {
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  variant?: "destructive" | "default";
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef) resolveRef(value);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose(false)}>
        <DialogContent className="sm:max-w-[400px] border shadow-2xl bg-background p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/10 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{options?.title}</DialogTitle>
                <DialogDescription className="text-xs font-medium">{options?.description || options?.message}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 p-6 bg-muted/5">
            <Button variant="ghost" size="sm" className="font-bold h-10 px-6" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button 
              variant={options?.variant || "destructive"} 
              size="sm" 
              className="font-bold h-10 px-8 shadow-lg shadow-destructive/20"
              onClick={() => handleClose(true)}
            >
              {options?.confirmText || "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmationProvider");
  return context;
}

// --- COMPONENT PATTERN ---
interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  confirmText?: string;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmText = "Delete",
  variant = "destructive"
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[400px] border shadow-2xl bg-background p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted/10 border-b">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
              <DialogDescription className="text-xs font-medium">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2 p-6 bg-muted/5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-bold h-10 px-6" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant={variant} 
            size="sm" 
            className="font-bold h-10 px-8 shadow-lg shadow-destructive/20"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
