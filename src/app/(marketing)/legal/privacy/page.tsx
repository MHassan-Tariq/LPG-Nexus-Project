import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LPG Nexus",
  description: "Learn how LPG Nexus collects, protects, and handles your business and customer data.",
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "Data Collection",
      content: "We collect business information, customer details for cylinder delivery tracking, and transaction logs. This data is essential for the core functionality of the management system."
    },
    {
      title: "How We Use Information",
      content: "Your data is used solely to provide your dashboard metrics, manage your inventory, and facilitate billing. We use anonymized data to improve our analytics engine."
    },
    {
      title: "Data Storage & Security",
      content: "All data is stored on secure, encrypted cloud servers. We implement industry-standard protocols to prevent unauthorized access, disclosure, or modification of your business records."
    },
    {
      title: "Cookies & Tracking",
      content: "We use essential cookies to maintain your login session and security. We also use performance cookies to monitor system speed and stability."
    },
    {
      title: "User Rights",
      content: "You have the right to export your data at any time. You may also request the deletion of your account and all associated operational data in accordance with local regulations."
    },
    {
      title: "Contact for Privacy Issues",
      content: "If you have questions regarding your data or our privacy practices, please contact our Data Protection Officer at lpgnexus1@gmail.com."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Legal Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Privacy <span className="text-purple-600">Policy</span></h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Effective Date: May 20, 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-16">
          {sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <span className="inline-block w-8 h-px bg-purple-600" />
                 {section.title}
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed text-lg pl-11">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
