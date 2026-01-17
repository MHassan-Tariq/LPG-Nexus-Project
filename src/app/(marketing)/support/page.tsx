import React from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, MessageCircle, HelpCircle, Rocket, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Support Center | LPG Nexus",
  description: "Find answers, documentation, and get the help you need to manage your LPG operations.",
};

export default function SupportPage() {
  return (
    <div className="bg-white">
      {/* Support Hero */}
      <section className="bg-slate-900 py-24 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 relative z-10">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-8 uppercase tracking-tight">
            How Can We <span className="text-blue-500">Help You?</span>
          </h1>
          <div className="relative max-w-2xl mx-auto">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
             <input 
                type="text" 
                placeholder="Search for articles, features, or troubleshooting..." 
                className="w-full h-16 pl-12 pr-6 rounded-2xl bg-white/10 border border-white/10 text-white focus:bg-white/20 focus:outline-none transition-all placeholder:text-slate-500 font-medium"
             />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-3 gap-8">
           {[
             { t: "Getting Started", d: "Learn the basics of setting up your distributor profile and warehouse.", icon: Rocket },
             { t: "Cylinder Management", d: "Deep dive into tracking delivery, returns, and inventory counts.", icon: BookOpen },
             { t: "Billing & Finance", d: "How to automate invoicing, manage payments, and generate reports.", icon: Shield },
             { t: "User Management", d: "Managing driver accounts, permissions, and multi-tenant access.", icon: HelpCircle },
             { t: "API & Integrations", d: "Technical guides for connecting LPG Nexus to your existing ERP.", icon: BookOpen },
             { t: "Troubleshooting", d: "Common issues and how to resolve them quickly in the field.", icon: HelpCircle }
           ].map((cat, i) => (
             <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-6">
                   <cat.icon className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{cat.t}</h4>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">{cat.d}</p>
             </div>
           ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Still Need Assistance?</h2>
            <p className="text-slate-600 font-medium mb-10">Our dedicated support team is available via email and WhatsApp to help you resolve any issues.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <a 
                 href="mailto:lpgnexus1@gmail.com?subject=Support Request" 
                 className="bg-[#2563EB] hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-black uppercase text-sm inline-block"
               >
                  Contact Support
               </a>
               <Button size="lg" variant="outline" className="border-slate-200 text-slate-600 px-10 rounded-xl font-black uppercase text-sm">
                  Developer Docs
               </Button>
            </div>
            <p className="mt-8 text-xs font-black text-slate-400 uppercase tracking-widest">Average Response Time: &lt; 2 Hours</p>
         </div>
      </section>
    </div>
  );
}
