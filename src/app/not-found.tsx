"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center space-y-8 max-w-lg"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 opacity-10"
          >
            <Compass className="size-48" />
          </motion.div>
          <h1 className="text-9xl font-black tracking-tighter text-foreground selection:bg-primary selection:text-primary-foreground">
            404
          </h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Location Not Found</h2>
          <p className="text-muted-foreground font-medium">
            The operational node you are trying to reach does not exist or has been decommissioned from the matrix.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.history.back()} className="h-11 px-8 font-bold">
            <ArrowLeft className="mr-2 size-4" /> Go Back
          </Button>
          <Button asChild className="h-11 px-8 font-bold">
            <Link href="/">
              <Home className="mr-2 size-4" /> System Dashboard
            </Link>
          </Button>
        </div>

        <div className="pt-12">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
            <div className="h-px w-8 bg-muted-foreground/20" />
            Resolve Enterprise Infrastructure
            <div className="h-px w-8 bg-muted-foreground/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
