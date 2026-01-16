"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  BarChart3,
  Zap,
  Bell,
  MessageCircle,
  TrendingUp,
  Crown,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PremiumOverviewTab() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "bill-designer">("overview");

  const features = [
    {
      id: "bill-designer",
      icon: FileText,
      iconColor: "bg-purple-500",
      title: "Bill & Report Designer",
      description: "Customize your invoices, bills, and reports with a visual editor.",
      status: "available",
      badge: "Available",
      buttonText: "Open Feature →",
      buttonAction: () => router.push("/settings?tab=bill-designing"),
    },
    {
      id: "advanced-analytics",
      icon: BarChart3,
      iconColor: "bg-green-500",
      title: "Advanced Analytics",
      description: "Deep insights with predictive analytics and forecasting.",
      status: "coming-soon",
      badge: "Coming Soon",
      buttonText: "Coming Soon",
    },
    {
      id: "smart-automation",
      icon: Zap,
      iconColor: "bg-orange-500",
      title: "Smart Automation",
      description: "Automate billing, reminders, and inventory management.",
      status: "coming-soon",
      badge: "Coming Soon",
      buttonText: "Coming Soon",
    },
    {
      id: "multi-channel-notifications",
      icon: Bell,
      iconColor: "bg-pink-500",
      title: "Multi-Channel Notifications",
      description: "SMS, Email, and WhatsApp notifications for customers.",
      status: "coming-soon",
      badge: "Coming Soon",
      buttonText: "Coming Soon",
    },
    {
      id: "crm",
      icon: MessageCircle,
      iconColor: "bg-blue-500",
      title: "Customer Relationship Management",
      description: "Manage customer interactions and improve satisfaction.",
      status: "coming-soon",
      badge: "Coming Soon",
      buttonText: "Coming Soon",
    },
    {
      id: "demand-forecasting",
      icon: TrendingUp,
      iconColor: "bg-teal-500",
      title: "Demand Forecasting",
      description: "AI-powered predictions for inventory and sales.",
      status: "coming-soon",
      badge: "Coming Soon",
      buttonText: "Coming Soon",
    },
  ];

  const benefits = [
    "Fully customizable bill and report templates",
    "Automated workflows and reminders",
    "Priority customer support",
    "Cloud backup and sync across devices",
    "Advanced analytics and insights",
    "Multi-channel customer notifications",
    "Regular feature updates and improvements",
    "AI-powered demand forecasting",
  ];

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-8 shadow-lg">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Premium Features</h1>
                <Badge className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                  <Crown className="mr-1 h-3 w-3" />
                  PRO
                </Badge>
              </div>
              <p className="mt-1 text-base text-white/90">
                Advanced tools and features to supercharge your LPG business.
              </p>
            </div>
          </div>
        </div>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-pink-600/50" />
      </div>

      {/* Tab Menu */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm",
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => router.push("/settings?tab=bill-designing")}
          className={cn(
            "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm",
            "bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          Bill Designer
        </button>
      </div>

      {/* Premium Features Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isAvailable = feature.status === "available";

          return (
            <div
              key={feature.id}
              className={cn(
                "group relative overflow-hidden rounded-[20px] border bg-white p-6 shadow-sm transition-all duration-300",
                isAvailable
                  ? "border-purple-200 hover:shadow-lg hover:shadow-purple-500/20"
                  : "border-slate-200 opacity-75 hover:shadow-md"
              )}
            >
              {/* Status Badge */}
              <div className="absolute right-4 top-4">
                {isAvailable ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <Check className="mr-1 h-3 w-3" />
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                    <span className="mr-1 text-xs">🔒</span>
                    Coming Soon
                  </Badge>
                )}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
                  feature.iconColor,
                  "text-white shadow-sm"
                )}
              >
                <Icon className="h-7 w-7" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>

              {/* Description */}
              <p className="mb-6 text-sm text-slate-600">{feature.description}</p>

              {/* Button */}
              {isAvailable ? (
                <Button
                  onClick={feature.buttonAction}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transition-all hover:shadow-lg hover:shadow-purple-500/30"
                >
                  {feature.buttonText}
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full rounded-xl bg-slate-100 text-slate-500 shadow-sm"
                >
                  {feature.buttonText}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium Benefits Section */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Why Upgrade to Premium?</h2>
          <p className="mt-2 text-base text-slate-600">
            Unlock the full potential of LPG Nexus with these exclusive benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <Check className="h-3 w-3 text-green-600" />
              </div>
              <p className="text-sm text-slate-700">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 p-8 shadow-lg">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          {/* Premium Plan Badge */}
          <div className="mb-6 flex justify-center">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-white">
              <Crown className="mr-2 h-4 w-4" />
              Premium Plan
            </Badge>
          </div>

          {/* Pricing */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-2xl font-semibold text-slate-500 line-through">Rs2000</span>
            <span className="text-4xl font-bold text-purple-700">Rs1000</span>
            <span className="text-xl text-slate-600">/month</span>
          </div>

          {/* Offer Text */}
          <p className="mb-6 text-base font-semibold text-pink-600">
            Limited time offer - Save 50%
          </p>

          {/* CTA Button */}
          <Button
            className="mb-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-purple-500/30"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Upgrade to Premium
          </Button>

          {/* Guarantee */}
          <p className="text-sm text-slate-600">30-day money-back guarantee</p>
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/30 to-pink-200/30" />
      </div>
    </div>
  );
}

