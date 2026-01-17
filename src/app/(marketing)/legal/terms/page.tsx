import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | LPG Nexus",
  description: "Read the terms and conditions governing the use of LPG Nexus software and services.",
};

export default function TermsPage() {
  const sections = [
    {
      title: "Introduction",
      content: "These Terms of Service ('Terms') govern your access to and use of the LPG Nexus platform, website, and related services ('Service'). By using the Service, you agree to be bound by these Terms."
    },
    {
      title: "Acceptance of Terms",
      content: "By creating an account or using the LPG Nexus platform, you explicitly agree to all terms outlined herein. If you do not agree, you must immediately cease all use of our services."
    },
    {
      title: "User Accounts & Responsibilities",
      content: "Users are responsible for maintaining the confidentiality of their credentials. You are liable for all activities occurring under your account. You agree to provide accurate and up-to-date business information for compliance purposes."
    },
    {
      title: "Subscription & Billing",
      content: "LPG Nexus operates on a subscription basis. All fees are non-refundable unless specified otherwise. We reserve the right to modify pricing with 30-day prior notice."
    },
    {
      title: "Data Usage & Ownership",
      content: "You retain all rights to your business data. LPG Nexus is granted a limited license to process this data solely to provide the Service. We do not sell your operational or customer data to third parties."
    },
    {
      title: "System Availability",
      content: "We strive for 99.9% uptime. However, we do not guarantee uninterrupted service and are not liable for losses due to system downtime caused by internet connectivity or third-party provider failures."
    },
    {
      title: "Limitation of Liability",
      content: "To the maximum extent permitted by law, LPG Nexus shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Legal Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Terms of <span className="text-blue-600">Service</span></h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Last Updated: May 20, 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-16">
          {sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <span className="inline-block w-8 h-px bg-blue-600" />
                 {section.title}
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed text-lg pl-11">
                {section.content}
              </p>
            </div>
          ))}
          
          <div className="pt-16 border-t border-slate-100">
             <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Contact for Legal Inquiries</h3>
             <p className="text-slate-500 font-bold mb-2 uppercase text-xs">Email: <a href="mailto:lpgnexus1@gmail.com" className="text-blue-600 hover:underline">lpgnexus1@gmail.com</a></p>
             <p className="text-slate-500 font-bold uppercase text-xs">Phone: <a href="tel:03037771186" className="text-blue-600 hover:underline">03037771186</a></p>
          </div>
        </div>
      </section>
    </div>
  );
}
