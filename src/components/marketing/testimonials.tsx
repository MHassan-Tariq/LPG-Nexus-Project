"use client";

import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, Kumar Gas Agency",
    text: "LPG Nexus has transformed how we manage our cylinder inventory. We've saved hours of manual work every week and our billing errors have dropped to zero.",
    avatar: "RK",
    color: "from-blue-500 to-blue-600"
  },
  {
    name: "Priya Sharma",
    role: "Manager, Sharma Enterprises",
    text: "The billing system is incredibly easy to use. Our customers love the professional invoices we can now generate. Highly recommended for any growing agency.",
    avatar: "PS",
    color: "from-purple-500 to-purple-600"
  },
  {
    name: "Amit Patel",
    role: "Director, Patel Gas Solutions",
    text: "The best investment for our business. The analytics help us make better decisions and the support team is always there when we need them.",
    avatar: "AP",
    color: "from-indigo-500 to-indigo-600"
  }
];

export function MarketingTestimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">
            Customer Stories
          </h2>
          <p className="text-base text-slate-600 font-medium">
            See what our customers have to say about their experience with LPG Nexus.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="p-8 rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-100/50 hover:-translate-y-1.5 transition-transform duration-300"
            >
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-base text-slate-700 leading-relaxed mb-6 font-medium italic">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{t.name}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
