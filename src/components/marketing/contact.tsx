"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export function MarketingContact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    
    const subject = encodeURIComponent(`Inquiry for LPG Nexus from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    
    window.location.href = `mailto:lpgnexus1@gmail.com?subject=${subject}&body=${body}`;
    
    toast.success("Opening your email client...", {
      description: "Please send the drafted email to complete the request.",
    });
  };

  return (
    <section id="contact" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">
            Get in Touch
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Contact Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/40 flex items-start gap-4 transition-all hover:border-blue-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm uppercase tracking-tight mb-0.5">Email</div>
                <a href="mailto:lpgnexus1@gmail.com" className="text-slate-600 text-sm font-bold hover:text-blue-600 transition-colors">lpgnexus1@gmail.com</a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/40 flex items-start gap-4 transition-all hover:border-purple-100">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm uppercase tracking-tight mb-0.5">Phone</div>
                <a href="tel:03037771186" className="text-slate-600 text-sm font-bold hover:text-purple-600 transition-colors">03037771186</a>
              </div>
            </div>

            {/* Final CTA Card */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-800 to-purple-800 text-white shadow-xl shadow-blue-500/10">
              <h3 className="text-xl font-black mb-3 uppercase tracking-tight">Ready to scale?</h3>
              <p className="text-blue-100/80 mb-6 font-bold text-sm leading-relaxed">
                Join 500+ distributors managing their operations efficiently.
              </p>
              <Button size="lg" className="w-full py-6 rounded-xl bg-white text-blue-800 hover:bg-blue-50 text-sm font-black uppercase tracking-wider group transition-all">
                Start Free Trial
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="p-8 lg:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50">
              <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Send a message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</Label>
                    <Input name="name" required placeholder="John Doe" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</Label>
                    <Input name="email" required type="email" placeholder="john@example.com" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message</Label>
                  <Textarea name="message" required placeholder="How can we help you?" className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white p-4 text-sm font-bold" />
                </div>

                <Button 
                  disabled={isSubmitting}
                  className="w-full py-7 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-black uppercase tracking-widest gap-3 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Sending..." : (
                    <>
                      Send Message
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
