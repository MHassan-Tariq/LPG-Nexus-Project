import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | LPG Nexus",
  description: "Learn about the mission and vision behind LPG Nexus, the leading cylinder management platform.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 text-center">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            Our Mission is <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Simple</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            We are building the digital nervous system for the global LPG distribution industry.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 font-medium text-slate-600 text-lg leading-relaxed space-y-8">
          <p>
            LPG Nexus was born out of a simple observation: while the rest of the world has gone digital, cylinder distribution remains stuck in the era of paper ledgers and manual phone calls. This inefficiency costs distributors thousands in lost cylinders, billing errors, and wasted logistics time.
          </p>
          <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100">
            <h3 className="text-xl font-black text-blue-900 mb-4 uppercase tracking-tight">The Problem We Solve</h3>
            <p className="text-blue-800/80">
              We eliminate the "black hole" of cylinder tracking. By digitizing every transaction from the warehouse to the customer's doorstep, we provide a level of visibility that was previously impossible for small and medium-sized distributors.
            </p>
          </div>
          <p>
            Today, LPG Nexus powers hundreds of distributors across the region, helping them manage inventories, automate complex billing cycles, and provide a superior experience to their end customers.
          </p>
          
          <div className="grid grid-cols-2 gap-8 pt-12">
            <div>
              <h4 className="text-3xl font-black text-slate-900 mb-1">2024</h4>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Founded</p>
            </div>
            <div>
              <h4 className="text-3xl font-black text-slate-900 mb-1">500+</h4>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Distributors</p>
            </div>
            <div>
              <h4 className="text-3xl font-black text-slate-900 mb-1">10M+</h4>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cylinders Managed</p>
            </div>
            <div>
              <h4 className="text-3xl font-black text-slate-900 mb-1">99.9%</h4>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-32" />
        <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10">
          <h2 className="text-3xl font-black mb-16 uppercase tracking-tight text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { t: "Transparency", d: "Real-time data for both distributors and their customers. No more guessing." },
              { t: "Reliability", d: "A system that works when you're in the field, even in low-connectivity areas." },
              { t: "Innovation", d: "Constantly evolving our tools to meet the changing needs of the energy sector." }
            ].map((v, i) => (
              <div key={i} className="space-y-4 text-center md:text-left">
                <div className="h-1 w-12 bg-blue-500 mx-auto md:mx-0" />
                <h4 className="text-xl font-black uppercase tracking-tight">{v.t}</h4>
                <p className="text-slate-400 font-bold leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
