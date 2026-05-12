"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="h-8 w-8 bg-[#0176D3] flex items-center justify-center rounded-sm transition-transform group-hover:scale-105 shrink-0">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <span className="font-bold text-lg tracking-tight text-foreground leading-none truncate">QTrack</span>
      )}
    </Link>
  );
}
