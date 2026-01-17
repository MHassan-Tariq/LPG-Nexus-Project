import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance | LPG Nexus",
  description: "Understand the security standards and compliance measures LPG Nexus maintains for the energy industry.",
};

export default function CompliancePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Industry <span className="text-blue-600">Compliance</span></h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Standards & Security</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-16">
           <article>
              <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Data Protection Compliance</h2>
              <p className="text-slate-600 font-medium leading-relaxed text-lg">
                 LPG Nexus aligns with global data protection standards. We ensure all personal and business data is handled with strict confidentiality, utilizing AES-256 encryption at rest.
              </p>
           </article>

           <article>
              <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Financial & Audit Readiness</h2>
              <p className="text-slate-600 font-medium leading-relaxed text-lg">
                 Our system maintains comprehensive audit logs for every transaction, change in inventory, and user action. This ensures your business is always ready for internal or external fiscal audits.
              </p>
           </article>

           <div className="grid md:grid-cols-2 gap-8">
              {[
                { t: "Security Standards", d: "Regular vulnerability scanning and penetration testing." },
                { t: "System Monitoring", d: "24/7 uptime monitoring and automated incident response." }
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-3xl bg-blue-50 border border-blue-100">
                   <h4 className="font-black text-blue-900 mb-2 uppercase tracking-tight">{item.t}</h4>
                   <p className="text-blue-800/80 font-bold text-sm leading-relaxed">{item.d}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
