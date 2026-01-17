"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Linkedin, Instagram, Github } from "lucide-react";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Updates", href: "/updates" },
        { label: "API Docs", href: "/docs/api" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Compliance", href: "/legal/compliance" },
        { label: "Support", href: "/support" }
      ]
    }
  ];

  return (
    <footer className="bg-slate-900 pt-20 pb-10 text-slate-400">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <img src="/lpgnexus-logo.png" alt="Logo" className="h-6 w-6 invert brightness-0" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                LPG Nexus
              </span>
            </div>
            <p className="text-lg leading-relaxed mb-8 max-sm">
              The only all-in-one cylinder management system designed for scale. Trusted by hundreds of distributors nationwide.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column, idx) => (
            <div key={idx}>
              <h4 className="text-white font-bold mb-6 text-lg">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link, lidx) => (
                  <li key={lidx}>
                    <Link href={link.href} className="hover:text-blue-500 transition-colors font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
          <div>
            © {currentYear} LPG Nexus Platform. All rights reserved.
          </div>
          <div className="flex gap-8">
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
