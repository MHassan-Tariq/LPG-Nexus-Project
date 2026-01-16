"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    try {
      // Here you would typically send the form data to your backend API
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setToast({ 
        message: "Thank you for contacting us! We'll get back to you soon.", 
        type: "success" 
      });
      
      form.reset();
      
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {toast.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-[24px] border border-transparent px-1">
        <h1 className="text-2xl font-semibold text-slate-900">Contact Us</h1>
        <p className="text-sm text-slate-500">Get in touch with our team</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information Card */}
        <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none lg:p-8">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Get in Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef3ff]">
                <Mail className="h-5 w-5 text-[#2544d6]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Email</h3>
                <p className="text-sm text-slate-600">lpgnexus1@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef3ff]">
                <Phone className="h-5 w-5 text-[#2544d6]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Phone</h3>
                <p className="text-sm text-slate-600">0303-7771186</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef3ff]">
                <MapPin className="h-5 w-5 text-[#2544d6]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Address</h3>
                <p className="text-sm text-slate-600">Faisalabad, Punjab, Pakistan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="lg:col-span-2">
          <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">Send us a Message</h2>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter your full name"
                    className="rounded-xl border-slate-300"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Enter your email"
                    className="rounded-xl border-slate-300"
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  placeholder="Enter your phone number"
                  className="rounded-xl border-slate-300"
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-slate-700">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  {...form.register("subject")}
                  placeholder="Enter message subject"
                  className="rounded-xl border-slate-300"
                />
                {form.formState.errors.subject && (
                  <p className="text-xs text-red-600">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  {...form.register("message")}
                  rows={6}
                  placeholder="Enter your message here..."
                  className="rounded-xl border-slate-300"
                />
                {form.formState.errors.message && (
                  <p className="text-xs text-red-600">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="rounded-xl border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 rounded-xl bg-[#1c5bff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

