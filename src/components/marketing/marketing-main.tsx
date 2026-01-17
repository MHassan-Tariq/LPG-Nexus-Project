"use client";

import React, { useEffect, useState } from "react";
import { useMarketing } from "@/context/marketing-context";
import { MarketingHeader } from "./header";
import { MarketingHero } from "./hero";
import { MarketingFeatures } from "./features";
import { MarketingPricing } from "./pricing";
import { MarketingTestimonials } from "./testimonials";
import { MarketingContact } from "./contact";
import { MarketingFooter } from "./footer";
import { cn } from "@/lib/utils";

export function MarketingWebsite() {
  const { isMarketingOpen } = useMarketing();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] h-screen w-screen overflow-y-auto bg-white transition-all duration-500 ease-in-out",
        isMarketingOpen 
          ? "translate-y-0 opacity-100" 
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col min-h-screen">
        <MarketingHeader />
        
        <main className="flex-grow">
          <MarketingHero />
          <MarketingFeatures />
          <MarketingPricing />
          <MarketingTestimonials />
          <MarketingContact />
        </main>
        
        <MarketingFooter />
      </div>
    </div>
  );
}
