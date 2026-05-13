"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="size-8 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
        <Image 
          src="/logo.png" 
          alt="Resolve Logo" 
          width={32} 
          height={32} 
          className="object-contain"
        />
      </div>
      {showText && (
        <span className="font-bold text-lg tracking-tight text-foreground leading-none truncate">Resolve</span>
      )}
    </Link>
  );
}
