"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type LayoutType = "sidebar" | "topnav";

interface LayoutContextType {
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
  toggleLayout: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layoutType, setLayoutType] = useState<LayoutType>("sidebar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("layout-type") as LayoutType;
    if (saved) setLayoutType(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("layout-type", layoutType);
    }
  }, [layoutType, mounted]);

  const toggleLayout = () => {
    setLayoutType((prev) => (prev === "sidebar" ? "topnav" : "sidebar"));
  };

  return (
    <LayoutContext.Provider value={{ layoutType, setLayoutType, toggleLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
