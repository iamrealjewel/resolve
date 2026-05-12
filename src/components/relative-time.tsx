"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function RelativeTime({ date }: { date: Date | string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">Loading...</span>;
  }

  return <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>;
}
