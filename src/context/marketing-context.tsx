"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface MarketingContextType {
  isMarketingOpen: boolean;
  openMarketing: () => void;
  closeMarketing: () => void;
  toggleMarketing: () => void;
}

const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

export function MarketingProvider({ children }: { children: React.ReactNode }) {
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);

  // Prevent scrolling when marketing overlay is open
  useEffect(() => {
    if (isMarketingOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMarketingOpen]);

  const openMarketing = () => setIsMarketingOpen(true);
  const closeMarketing = () => setIsMarketingOpen(false);
  const toggleMarketing = () => setIsMarketingOpen((prev) => !prev);

  return (
    <MarketingContext.Provider
      value={{ isMarketingOpen, openMarketing, closeMarketing, toggleMarketing }}
    >
      {children}
    </MarketingContext.Provider>
  );
}

export function useMarketing() {
  const context = useContext(MarketingContext);
  if (context === undefined) {
    throw new Error("useMarketing must be used within a MarketingProvider");
  }
  return context;
}
