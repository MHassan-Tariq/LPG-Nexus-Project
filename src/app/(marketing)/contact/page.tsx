import React from "react";
import { MarketingContact } from "@/components/marketing/contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | LPG Nexus",
  description: "Get in touch with the LPG Nexus team for support, sales, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 text-center">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-tight">
            We're Here <br /> <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">To Help You Scale</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Whether you have a question about features, pricing, or just want to chat about your business goals, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Re-use central contact component */}
      <MarketingContact />

      {/* Location/Office Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-6">
                 <img src="/lpgnexus-logo.png" alt="Logo" className="h-6 w-6 opacity-30 grayscale" />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Business Hours</h4>
              <p className="text-slate-500 font-bold text-sm">
                Monday — Saturday<br />
                9:00 AM — 6:00 PM
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mx-auto mb-6 opacity-80" />
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Enterprise Sales</h4>
              <p className="text-slate-500 font-bold text-sm">
                <a href="mailto:lpgnexus1@gmail.com?subject=Enterprise Sales Inquiry" className="hover:text-purple-600 transition-colors">lpgnexus1@gmail.com</a><br />
                <a href="tel:03037771186" className="hover:text-purple-600 transition-colors">03037771186</a>
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 mx-auto mb-6 opacity-50" />
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">General Support</h4>
              <p className="text-slate-500 font-bold text-sm">
                Looking for help? Browse our<br />
                <a href="/support" className="text-blue-600 hover:underline">Support Center</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
