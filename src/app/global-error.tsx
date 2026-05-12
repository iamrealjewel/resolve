"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-background text-foreground antialiased`}>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="space-y-8 max-w-md">
            <div className="size-20 bg-destructive flex items-center justify-center mx-auto shadow-2xl">
              <AlertTriangle className="size-10 text-destructive-foreground" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase">Kernel Panic</h1>
              <p className="text-muted-foreground font-medium">
                A critical failure occurred at the infrastructure level. The system container has been isolated.
              </p>
            </div>

            <Button 
              onClick={() => reset()} 
              className="h-12 px-10 font-bold bg-primary text-primary-foreground text-lg uppercase tracking-widest"
            >
              <RefreshCcw className="mr-3 size-5" /> Cold Reboot
            </Button>

            {error.digest && (
              <p className="text-[10px] font-mono font-bold text-muted-foreground/30 mt-8">
                CORE_DIGEST: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
