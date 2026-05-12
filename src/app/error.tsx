"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center space-y-8 max-w-xl"
      >
        <div className="size-24 bg-destructive/10 flex items-center justify-center rounded-none border border-destructive/20 relative">
          <AlertTriangle className="size-10 text-destructive" />
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-destructive/5 -z-10"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tighter uppercase">System Malfunction</h1>
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            The core engine encountered a critical operational disruption. All processes have been halted to prevent data corruption.
          </p>
        </div>

        {error.digest && (
          <div className="bg-muted/30 border px-4 py-2 flex items-center gap-3">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Digest:</span>
             <code className="text-[10px] font-mono font-bold text-primary">{error.digest}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={() => reset()} className="h-11 px-8 font-bold bg-foreground text-background hover:bg-foreground/90">
            <RefreshCcw className="mr-2 size-4" /> Restart Engine
          </Button>
          <Button variant="outline" asChild className="h-11 px-8 font-bold">
            <Link href="/">
              <Home className="mr-2 size-4" /> Return to Base
            </Link>
          </Button>
        </div>

        <div className="w-full pt-8 space-y-4">
          <details className="group">
            <summary className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none">
              <ChevronRight className="size-3 group-open:rotate-90 transition-transform" />
              Technical Incident Log
            </summary>
            <div className="mt-4 p-4 bg-muted/20 border text-left overflow-auto max-h-48 rounded-none">
              <pre className="text-[10px] font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {error.stack || error.message || "No stack trace available."}
              </pre>
            </div>
          </details>
        </div>
      </motion.div>
    </div>
  );
}
