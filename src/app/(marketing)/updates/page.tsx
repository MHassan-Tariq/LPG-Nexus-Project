import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Updates | LPG Nexus",
  description: "Stay up to date with the latest features, improvements, and fixes for the LPG Nexus platform.",
};

export default function UpdatesPage() {
  const updates = [
    {
      version: "v2.4.0",
      date: "May 15, 2024",
      title: "IoT Sensor Integration",
      description: "Direct integration with smart valve sensors for real-time inventory level alerts.",
      tags: ["New Feature", "Hardware"]
    },
    {
      version: "v2.3.2",
      date: "May 2, 2024",
      title: "Enhanced Reporting Performance",
      description: "Massive performance upgrades to the analytics engine. Dashboard now loads 4x faster.",
      tags: ["Performance", "Optimization"]
    },
    {
      version: "v2.3.0",
      date: "Apr 20, 2024",
      title: "Multi-Warehouse Beta",
      description: "Manage multiple distribution points from a single administrative master account.",
      tags: ["Beta", "Multi-tenant"]
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 text-center">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            Product <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Updates</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Follow our journey as we build the most advanced management system for LPG distributors.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-16">
           {updates.map((update, i) => (
             <div key={i} className="relative pl-12 border-l-2 border-slate-100">
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" />
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{update.version}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{update.date}</span>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">{update.title}</h3>
                   <p className="text-slate-600 text-lg font-medium leading-relaxed">{update.description}</p>
                   <div className="flex gap-2">
                      {update.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           {tag}
                        </span>
                      ))}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
         <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10 text-center">
            <h2 className="text-3xl font-black mb-12 uppercase tracking-tight">Upcoming Roadmap</h2>
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { q: "Q3 2024", t: "Smart Route Optimization", d: "AI-driven route planning for delivery fleets." },
                 { q: "Q4 2024", t: "WhatsApp Direct Invoicing", d: "Send PDF bills directly to customer WhatsApp automatically." },
                 { q: "Q1 2025", t: "IoT Hub V2", d: "Support for a wider range of hardware sensors and trackers." }
               ].map((item, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl text-left">
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 inline-block">{item.q}</span>
                    <h4 className="text-lg font-black uppercase mb-2 tracking-tight">{item.t}</h4>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed">{item.d}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
