import React from "react";
import { MarketingFeatures } from "@/components/marketing/features";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | LPG Nexus",
  description: "Explore the powerful features of LPG Nexus designed for LPG cylinder distributors and retailers.",
};

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 text-center">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Run LPG Operations</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            From inventory tracking to automated billing, our platform is built to handle the complexities of cylinder logistics at any scale.
          </p>
        </div>
      </section>

      {/* Re-use central features component */}
      <MarketingFeatures />

      {/* Real-world Use Cases */}
      <section className="py-24 bg-slate-100/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">For Small Distributors</h3>
              <p className="text-slate-600 mb-6 font-medium leading-relaxed">
                Eliminate manual paperwork. Track every cylinder delivery and return with a simple mobile interface. Never lose track of a deposit or an empty bottle again.
              </p>
              <ul className="space-y-3">
                {['Single-point inventory', 'Customer SMS alerts', 'Standardized billing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">For Enterprise Retailers</h3>
              <p className="text-slate-600 mb-6 font-medium leading-relaxed">
                Manage multiple warehouses and thousands of customers. Get real-time analytics on sales trends, inventory turnover, and driver performance.
              </p>
              <ul className="space-y-3">
                {['Multi-tenant management', 'ERP integration ready', 'Advanced fiscal reporting'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-8 uppercase tracking-tight">Ready to Modernize Your Business?</h2>
          <Link href="/login">
            <Button size="lg" className="bg-[#2563EB] hover:bg-blue-700 text-white px-10 py-8 rounded-2xl text-lg font-black shadow-2xl shadow-blue-500/20 transition-all uppercase tracking-widest group">
              Start Using LPG Nexus
              <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
