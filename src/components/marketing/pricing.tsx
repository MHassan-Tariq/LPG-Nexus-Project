"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "999",
    features: [
      "Up to 100 customers",
      "500 bills/month",
      "Basic reports",
      "Email support",
      "Mobile app access"
    ]
  },
  {
    name: "Professional",
    price: "2,499",
    popular: true,
    features: [
      "Unlimited customers",
      "Unlimited bills",
      "Advanced analytics",
      "Priority support",
      "Custom templates",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Everything in Pro",
      "Multi-location support",
      "Dedicated account manager",
      "Custom integrations",
      "White-label option",
      "SLA guarantee"
    ]
  }
];

export function MarketingPricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">
            Transparent Pricing
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-medium">
            Choose the plan that fits your business needs. No hidden charges.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={cn(
                "relative p-8 rounded-[2rem] transition-all duration-300 bg-white border flex flex-col justify-between",
                plan.popular 
                  ? "border-blue-600 shadow-xl shadow-blue-500/10 z-10 scale-105" 
                  : "border-slate-100 shadow-md shadow-slate-200/50"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-base font-black text-slate-900 mb-3 uppercase tracking-wider">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      {plan.price !== "Custom" && "₹"}
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && <span className="text-slate-400 font-bold text-xs uppercase">/ month</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2.5 text-slate-600">
                      <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-green-600" strokeWidth={4} />
                      </div>
                      <span className="text-xs font-bold">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.price === "Custom" ? (
                <a 
                  href={`mailto:lpgnexus1@gmail.com?subject=Inquiry for ${plan.name} Plan`}
                  className={cn(
                    "w-full py-6 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-wide inline-block text-center",
                    "bg-slate-50 hover:bg-slate-100 text-slate-900"
                  )}
                >
                  Contact Us
                </a>
              ) : (
                <a 
                  href="/login?registered=true"
                  className={cn(
                    "w-full py-6 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-wide inline-block text-center",
                    plan.popular 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-200" 
                      : "bg-slate-50 hover:bg-slate-100 text-slate-900"
                  )}
                >
                  Get Started
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
