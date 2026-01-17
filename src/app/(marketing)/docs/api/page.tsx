import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference | LPG Nexus",
  description: "Technical documentation for integrating with the LPG Nexus platform and building custom distribution workflows.",
};

export default function ApiDocsPage() {
  return (
    <div className="bg-white">
      {/* Docs Hero */}
      <section className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            API <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl font-medium leading-relaxed">
            Build custom integrations, automate reports, and connect your existing infrastructure to the LPG Nexus cloud.
          </p>
        </div>
      </section>

      {/* Docs Content */}
      <section className="py-24 max-w-6xl mx-auto px-6 lg:px-10 grid md:grid-cols-4 gap-12">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block space-y-8">
           <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Introduction</h4>
              <ul className="space-y-3 text-sm font-bold text-slate-600">
                 <li className="text-blue-600">Overview</li>
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Authentication</li>
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Rate Limits</li>
              </ul>
           </div>
           <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Core Resources</h4>
              <ul className="space-y-3 text-sm font-bold text-slate-600">
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Customers</li>
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Inventory</li>
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Transactions</li>
                 <li className="hover:text-slate-900 transition-colors cursor-pointer">Billing</li>
              </ul>
           </div>
        </aside>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-12">
           <article>
              <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Overview</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">
                 The LPG Nexus API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
              </p>
              <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto">
                 <pre className="text-blue-400 font-mono text-sm">
                    <code>{`// Root Endpoint\nGET https://api.lpgnexus.com/v1`}</code>
                 </pre>
              </div>
           </article>

           <article>
              <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Authentication</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">
                 The API uses API keys to authenticate requests. You can view and manage your API keys in the LPG Nexus Dashboard. Your API keys carry many privileges, so be sure to keep them secure!
              </p>
              <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto">
                 <pre className="text-slate-400 font-mono text-sm">
                    <code className="text-purple-400">Authorization: Bearer YOUR_API_KEY</code>
                 </pre>
              </div>
           </article>

            <article className="p-8 rounded-3xl bg-blue-50 border border-blue-100">
               <h3 className="text-xl font-black text-blue-900 mb-4 uppercase tracking-tight">Need a Sandbox?</h3>
               <p className="text-blue-800/80 font-medium text-sm leading-relaxed mb-6">
                  We provide a full staging environment for testing your integrations before going live. Contact our enterprise support team to request access.
               </p>
               <a 
                 href="mailto:lpgnexus1@gmail.com?subject=Staging Access Request" 
                 className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest inline-block"
               >
                 Request Staging Access
               </a>
            </article>
        </div>
      </section>
    </div>
  );
}
