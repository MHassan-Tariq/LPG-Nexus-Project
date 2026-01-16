import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy - LPG Nexus",
  description: "Privacy Policy for LPG Nexus Management System",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/register">
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </Button>
          </Link>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">🔒 PRIVACY POLICY</h1>
            <p className="mt-2 text-lg text-slate-600">LPG NEXUS</p>
            <p className="mt-4 text-sm text-slate-500">Last Updated: December 2025</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <p className="mb-3 text-sm font-semibold text-blue-900">Contact:</p>
          <div className="space-y-1">
            <p className="text-blue-700">📧 lpgnexus1@gmail.com</p>
            <p className="text-blue-700">📞 0303-7771186</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Privacy Content */}
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">1. Introduction</h2>
              <p className="mb-3 leading-relaxed">
                Your privacy is important to us.
              </p>
              <p className="leading-relaxed">
                This Privacy Policy explains how LPG Nexus collects, uses, protects, and stores your information. By using LPG Nexus, you consent to this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">2. Information We Collect</h2>
              
              <h3 className="mb-2 text-lg font-semibold text-slate-800">2.1 Personal Information</h3>
              <p className="mb-3 leading-relaxed">
                When registering or using the system, we may collect:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Business details</li>
                <li>Branch information</li>
                <li>User roles & permissions</li>
              </ul>

              <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-800">2.2 System Information</h3>
              <p className="mb-3 leading-relaxed">The software may collect:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Activity logs</li>
                <li>Login timestamps</li>
                <li>User actions (for Admin and Super Admin activity tracking)</li>
                <li>IP address (optional depending on server)</li>
              </ul>

              <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-800">2.3 Business Data Entered by You</h3>
              <p className="mb-3 leading-relaxed">Examples include:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Customer records</li>
                <li>Sales & delivery logs</li>
                <li>Inventory data</li>
                <li>Payments & expenses</li>
                <li>Notes and reports</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                This data is owned fully by you and not shared with third parties.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">3. How We Use Your Information</h2>
              <p className="mb-3 leading-relaxed">We use your data to:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Provide and maintain the LPG Nexus platform</li>
                <li>Improve features and user experience</li>
                <li>Enable admin controls and permissions</li>
                <li>Create analytics and reports</li>
                <li>Secure accounts using OTP and email verification</li>
                <li>Communicate important updates or warnings</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                We do not sell or share your data with advertisers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">4. Security Measures</h2>
              <p className="mb-3 leading-relaxed">To protect your information, we use:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Encrypted passwords</li>
                <li>OTP verification for dangerous actions</li>
                <li>Role-based access control</li>
                <li>Secure backups</li>
                <li>Activity logging for monitoring</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Despite these measures, no system is completely risk-free. Please protect your account credentials.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">5. Data Storage & Retention</h2>
              <p className="mb-3 leading-relaxed">
                Your data is stored securely and retained as long as your account or business is active.
              </p>
              <p className="mb-3 leading-relaxed">You may request:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Data export</li>
                <li>Data deletion</li>
                <li>Account closure</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Some logs may be retained for security purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">6. Data Deletion & System Reset</h2>
              <p className="mb-3 leading-relaxed">The "Delete All Data" feature:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Wipes ALL database records</li>
                <li>Requires OTP security verification</li>
                <li>Can only be used by authorized Super Admins</li>
                <li>Cannot be undone once confirmed</li>
              </ul>
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900">Use carefully.</p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">7. Third-Party Services</h2>
              <p className="mb-3 leading-relaxed">
                If the software uses any third-party integrations (email services, hosting, etc.):
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>They follow their own privacy policies</li>
                <li>Only limited data required for functionality is shared</li>
                <li>No third-party has access to your business records</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">8. Children's Privacy</h2>
              <p className="leading-relaxed">
                This system is not intended for individuals under 18 years of age.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">9. Your Rights</h2>
              <p className="mb-3 leading-relaxed">
                Depending on your region, you may:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Access your data</li>
                <li>Update your data</li>
                <li>Request deletion</li>
                <li>Download a copy (backup)</li>
                <li>Change permissions</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Requests can be made via our support contact.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">10. Contact Us</h2>
              <p className="mb-3 leading-relaxed">
                If you have concerns or questions about your privacy:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-700">📧 lpgnexus1@gmail.com</p>
                <p className="mt-2 text-slate-700">📞 0303-7771186</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <Link href="/register" className="text-[#1c5bff] hover:underline">
            Return to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

