import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | LPG Nexus",
  description: "Transparency about how we use cookies and tracking technologies to optimize your experience.",
};

export default function CookiesPage() {
  const cookieTypes = [
    {
      title: "Essential Cookies",
      content: "Necessary for the website to function. These handles authentication, security, and session management. They cannot be turned off."
    },
    {
      title: "Analytics Cookies",
      content: "These tell us how you use the platform (e.g., how long you spend on the dashboard). We use this data to identify and fix bottlenecks."
    },
    {
      title: "Functional Cookies",
      content: "Used to remember your preferences, such as selected currency or dashboard layout settings."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-slate-50 py-20 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Cookie <span className="text-slate-500">Policy</span></h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Last Modified: May 20, 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-16">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">What Are Cookies?</h2>
            <p className="text-slate-600 font-medium leading-relaxed text-lg">
              Cookies are small text files stored on your device when you visit a website. They help us provide a secure and efficient user experience for your business.
            </p>
          </div>

          <div className="grid gap-8">
            {cookieTypes.map((cookie, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                <h3 className="font-black text-slate-900 mb-3 uppercase tracking-tight">{cookie.title}</h3>
                <p className="text-slate-600 font-bold text-sm leading-relaxed">{cookie.content}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Managing Your Cookies</h2>
            <p className="text-slate-600 font-medium leading-relaxed text-lg">
              You can manage cookie preferences through your browser settings. Note that disabling essential cookies will prevent you from accessing the LPG Nexus management tools.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
