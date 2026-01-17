import React from "react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-white">
      <MarketingHeader />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
