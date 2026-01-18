"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function MarketingHeader() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Updates", href: "/updates" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[110] transition-all duration-300 px-6 lg:px-10",
        isScrolled 
          ? "py-2 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm" 
          : "py-4 bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <img src="/lpgnexus-logo.png" alt="Logo" className="h-5 w-5 invert brightness-0" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
            LPG Nexus
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-blue-600 gap-2 font-semibold text-xs transition-all"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            BACK TO ADMIN
          </Button>
          <Link href="/login">
            <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 rounded-lg font-bold text-xs shadow-md shadow-blue-200 transition-all active:scale-95">
              GET STARTED
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-slate-700 p-2 uppercase tracking-tight"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-slate-100" />
            <Button
              variant="outline"
              className="justify-start gap-2 border-slate-200 text-slate-600 font-bold uppercase text-xs"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/dashboard");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
            <Link href="/login" className="w-full">
              <Button className="bg-[#2563EB] hover:bg-blue-700 text-white w-full rounded-xl font-bold uppercase">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
