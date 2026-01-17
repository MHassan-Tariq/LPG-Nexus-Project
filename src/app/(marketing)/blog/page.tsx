import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | LPG Nexus",
  description: "Insights, trends, and best practices for the modern LPG distribution industry.",
};

export default function BlogPage() {
  const posts = [
    {
      title: "The Future of LPG Logistics: Why IoT Matters",
      excerpt: "How real-time monitoring and smart cylinders are changing the way distributors manage inventory.",
      date: "May 12, 2024",
      category: "Industry Insights",
      image: "/images/blog/iot.png"
    },
    {
      title: "5 Common Billing Errors That Are Costing You Money",
      excerpt: "Traditional ledger systems fail in high-volume environments. Here's how to modernize your billing pipeline.",
      date: "May 8, 2024",
      category: "Operations",
      image: "/images/blog/billing.png"
    },
    {
      title: "Sustainable Distribution: Reducing Carbon Footprint",
      excerpt: "Route optimization isn't just about speed—it's about building a sustainable future for energy logistics.",
      date: "Apr 28, 2024",
      category: "Sustainability",
      image: "/images/blog/sustainability.png"
    }
  ];

  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            The <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LPG Nexus Blog</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl font-medium leading-relaxed">
            Expert analysis, product updates, and operational strategies for the cylinder distribution sector.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-3 gap-10">
            {posts.map((post, i) => (
              <article key={i} className="group cursor-pointer">
                <div className="aspect-[16/9] rounded-2xl mb-6 border border-slate-200 overflow-hidden relative shadow-lg shadow-slate-200/50">
                   <img 
                     src={post.image} 
                     alt={post.title} 
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                   />
                   <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                         {post.category}
                      </span>
                   </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>{post.date}</span>
                     <span>•</span>
                     <span className="text-blue-600 font-bold">{post.category}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
