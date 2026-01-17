// No direct changes needed here as it uses MarketingPricing, checking that component next.
import { MarketingPricing } from "@/components/marketing/pricing";
import { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | LPG Nexus",
  description: "Simple, transparent pricing for LPG distributors of all sizes. Start with a 14-day free trial.",
};

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-900 py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1e293b_0%,_transparent_40%),radial-gradient(circle_at_bottom_left,_#0f172a_0%,_transparent_40%)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-tight">
            Plans for Every <br /> <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Stage of Growth</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Transparent pricing with no hidden fees. Start for free and scale as you grow your distribution network.
          </p>
        </div>
      </section>

      {/* Re-use central pricing component */}
      <MarketingPricing />

      {/* Detailed Comparison Table */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl font-black text-slate-900 mb-12 uppercase tracking-tight text-center">Detailed Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-6 px-4 text-sm font-black text-slate-400 uppercase tracking-widest">Feature</th>
                  <th className="py-6 px-4 text-sm font-black text-slate-900 uppercase tracking-widest">Starter</th>
                  <th className="py-6 px-4 text-sm font-black text-blue-600 uppercase tracking-widest">Professional</th>
                  <th className="py-6 px-4 text-sm font-black text-purple-600 uppercase tracking-widest">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-600">
                {[
                  ['Cylinder Tracking', 'Up to 500', 'Unlimited', 'Unlimited'],
                  ['Customer Records', 'Unlimited', 'Unlimited', 'Unlimited'],
                  ['Digital Invoicing', 'Basic', 'Customized', 'White-labeled'],
                  ['Analytics Dashboard', '7 Days', '30 Days', 'Lifetime'],
                  ['Mobile Delivery App', 'Included', 'Priority Sync', 'Offline Mode'],
                  ['Multi-Warehouse', 'No', 'Up to 3', 'Unlimited'],
                  ['API Access', 'No', 'Limited', 'Full'],
                  ['Support', 'Email', 'Priority WhatsApp', 'Dedicated Manager'],
                ].map(([feature, s, p, e], i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-4 text-slate-900">{feature}</td>
                    <td className="py-5 px-4">{s}</td>
                    <td className="py-5 px-4">{p}</td>
                    <td className="py-5 px-4">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-12 uppercase tracking-tight text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time from your admin dashboard." },
              { q: "Do you offer a free trial?", a: "Every new account starts with a 14-day full-access trial of the Professional plan." },
              { q: "Is my data secure?", a: "We use enterprise-grade encryption and daily backups to ensure your business data is always safe." },
              { q: "Do I need special hardware?", a: "No, LPG Nexus works on any smartphone, tablet, or computer with a web browser." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-900 mb-2 uppercase text-sm tracking-tight">{faq.q}</h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
