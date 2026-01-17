"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2 } from "lucide-react";

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const jobs = [
    { role: "Senior Frontend Engineer", team: "Engineering", loc: "Remote" },
    { role: "Product Manager (Logistics)", team: "Product", loc: "Remote / Hybrid" },
    { role: "Growth Lead", team: "Marketing", loc: "Remote" }
  ];

  const handleApply = (jobTitle: string) => {
    setSelectedJob(jobTitle);
    setIsApplying(true);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const portfolio = formData.get("portfolio");
    const note = formData.get("note");

    const subject = encodeURIComponent(`[Job Application] - ${selectedJob} - ${name}`);
    const body = encodeURIComponent(
      `PROFESSIONAL JOB APPLICATION\n` +
      `============================\n\n` +
      `Position: ${selectedJob}\n` +
      `Candidate: ${name}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      `Portfolio/LinkedIn: ${portfolio}\n\n` +
      `Selected File: ${selectedFile?.name || "None"}\n\n` +
      `Cover Note:\n${note}\n\n` +
      `----------------------------\n` +
      `NOTE TO CANDIDATE:\n` +
      `Your email client is opening. Please manually ATTACH the file "${selectedFile?.name}" to the email before sending.`
    );

    window.location.href = `mailto:lpgnexus1@gmail.com?subject=${subject}&body=${body}`;
    
    toast.success("Opening your email client...", {
      description: `Please attach "${selectedFile?.name}" to the drafted email.`,
    });
    
    setIsApplying(false);
  };

  return (
    <div className="bg-white">
      {/* Page Hero */}
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay" />
        <div className="max-w-6xl mx-auto px-6 lg:px-10 text-center relative z-10">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight">
            Build the <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Global Energy Infrastructure</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            We're a team of engineers, operations experts, and energy veterans solving complex logistics problems for the LPG industry.
          </p>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">Why LPG Nexus?</h2>
              <div className="space-y-6">
                {[
                  { t: "Solving Hard Problems", d: "Logistics in the energy sector is messy. We're making it clean, digital, and predictable." },
                  { t: "Remote-First Culture", d: "We value output over hours. Work from anywhere that makes you most productive." },
                  { t: "Direct Impact", d: "Your code and decisions directly affect the efficiency of essential energy distribution." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                    <div>
                      <h4 className="font-black text-slate-900 mb-1 uppercase text-sm tracking-tight">{item.t}</h4>
                      <p className="text-slate-600 font-bold text-sm leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="aspect-square md:aspect-video rounded-3xl border border-slate-200 overflow-hidden relative shadow-2xl shadow-blue-500/10">
                <img 
                  src="/images/careers/culture.png" 
                  alt="LPG Nexus Culture" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-8">
                  <p className="text-xl font-black text-white italic uppercase tracking-tight">
                    "Efficiency through digital transparency."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl font-black text-slate-900 mb-12 uppercase tracking-tight text-center">Open Positions</h2>
          <div className="grid gap-6">
            {jobs.map((job, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                <div>
                   <h4 className="text-xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{job.role}</h4>
                   <div className="flex gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <span>{job.team}</span>
                      <span>•</span>
                      <span>{job.loc}</span>
                   </div>
                </div>
                <Button 
                  onClick={() => handleApply(job.role)}
                  variant="outline" 
                  className="border-slate-200 font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                   Apply Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Sheet */}
      <Sheet open={isApplying} onOpenChange={setIsApplying}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 border-l border-slate-200">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 border-b border-slate-100 space-y-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                Join our team
              </div>
              <SheetTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Apply for {selectedJob}
              </SheetTitle>
              <SheetDescription className="text-slate-500 font-bold text-sm">
                Complete the form below and we'll be in touch shortly.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                <Input name="name" required placeholder="John Doe" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                  <Input name="email" type="email" required placeholder="john@example.com" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                  <Input name="phone" required placeholder="+91 ..." className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn / Portfolio URL</Label>
                <Input name="portfolio" placeholder="https://..." className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Why LPG Nexus?</Label>
                <Textarea name="note" required placeholder="Tell us about your experience and why you're a fit..." className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white p-4 text-sm" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload CV / Resume (PDF)</Label>
                <div className="relative group cursor-pointer">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={cn(
                    "flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-300",
                    selectedFile 
                      ? "border-green-400 bg-green-50/50" 
                      : "border-slate-200 bg-slate-50 group-hover:border-blue-400 group-hover:bg-blue-50/30"
                  )}>
                    {selectedFile ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 shadow-sm">
                           <FileText className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-slate-900 mb-1">{selectedFile.name}</p>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">File Selected - Ready to attach</p>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shadow-sm">
                           <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Click to upload CV</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF, DOC (MAX 5MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-800 leading-relaxed">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="uppercase font-black text-blue-900 block mb-1">Professional Step:</span>
                    Your email client will open with a drafted application. You must <strong>manually attach</strong> the file "{selectedFile?.name || 'your CV'}" to the email before sending.
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black uppercase text-sm tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
                Generate Application Email
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
