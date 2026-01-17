"use client";

import React from "react";
import { 
  Users, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Package, 
  CreditCard, 
  Smartphone, 
  Cloud, 
  Zap 
} from "lucide-react";

const features = [
  {
    title: "Customer Management",
    desc: "Track customer details, history, and preferences in one centralized place.",
    icon: Users,
    color: "bg-blue-100 text-blue-600"
  },
  {
    title: "Smart Billing",
    desc: "Generate professional bills instantly with customizable templates and tax handling.",
    icon: Receipt,
    color: "bg-purple-100 text-purple-600"
  },
  {
    title: "Real-time Analytics",
    desc: "Make data-driven decisions with comprehensive reports and sales growth charts.",
    icon: BarChart3,
    color: "bg-green-100 text-green-600"
  },
  {
    title: "Secure & Reliable",
    desc: "Bank-level security with automatic encrypted backups to protect your business data.",
    icon: ShieldCheck,
    color: "bg-red-100 text-red-600"
  },
  {
    title: "Inventory Tracking",
    desc: "Monitor cylinder stock levels across multiple locations and prevent shortages.",
    icon: Package,
    color: "bg-orange-100 text-orange-600"
  },
  {
    title: "Payment Management",
    desc: "Track payments, pending dues, and generate receipts with automated reminders.",
    icon: CreditCard,
    color: "bg-indigo-100 text-indigo-600"
  },
  {
    title: "Mobile Friendly",
    desc: "Access your business data anywhere, anytime from any smartphone or tablet.",
    icon: Smartphone,
    color: "bg-cyan-100 text-cyan-600"
  },
  {
    title: "Cloud Backup",
    desc: "Never lose your data with automatic cloud synchronization and easy recovery.",
    icon: Cloud,
    color: "bg-sky-100 text-sky-600"
  },
  {
    title: "Workflow Automation",
    desc: "Automate repetitive tasks and focus on scaling your LPG distribution network.",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-600"
  }
];

export function MarketingFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">
            Everything You Need to Scale
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-medium">
            Powerful features designed specifically for LPG cylinder distributors and retailers to automate operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className={`${feature.color} h-12 w-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight uppercase">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
