"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlayCircle, CheckCircle2 } from "lucide-react";

export function MarketingHero() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-[radial-gradient(circle_at_top_right,_#f0f7ff_0%,_transparent_40%),radial-gradient(circle_at_bottom_left,_#faf5ff_0%,_transparent_40%)]">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 uppercase tracking-wide">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Trusted by 500+ LPG Distributors
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] mb-5 tracking-tight uppercase">
            Modern Cylinder Management Made <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Simple</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg font-medium">
            Streamline your LPG cylinder inventory, billing, and customer management with our all-in-one cloud solution. Save time, reduce errors, and grow your business.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/login">
              <Button size="lg" className="bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-6 rounded-xl text-base font-bold shadow-lg shadow-blue-500/10 group transition-all">
                Start Free Trial
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-200 hover:bg-slate-50 px-6 py-6 rounded-xl text-base font-bold gap-2 transition-all">
              <PlayCircle className="h-5 w-5 text-blue-600" />
              Watch Demo
            </Button>
          </div>
          
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-8">
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">500+</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">50K+</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Invoices Sent</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">99.9%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Side: Mockup */}
        <div className="relative scale-90 lg:scale-100 scale-origin-right">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-2xl border border-slate-200/60 bg-white shadow-2xl animate-in fade-in zoom-in duration-1000">
            {/* Browser Header */}
            <div className="h-8 bg-slate-50 border-b border-slate-200/60 flex items-center px-4 gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            
            {/* Dashboard Visual */}
            <div className="p-6 space-y-4">
              <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-2">
                  <div className="h-2 w-8 bg-blue-200 rounded" />
                  <div className="h-4 w-12 bg-blue-600 rounded" />
                </div>
                <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                  <div className="h-2 w-8 bg-slate-200 rounded" />
                  <div className="h-4 w-12 bg-slate-800 rounded" />
                </div>
                <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                  <div className="h-2 w-8 bg-slate-200 rounded" />
                  <div className="h-4 w-12 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-40 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
                 <div className="h-4/5 w-4/5 flex items-end gap-1.5">
                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                 </div>
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <div className="absolute -bottom-4 -left-6 p-4 bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-slate-100 animate-in slide-in-from-left-4 duration-1000 animate-float">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-800 whitespace-nowrap">Invoice Sent Successfully</div>
                  <div className="text-[10px] text-slate-500">Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
