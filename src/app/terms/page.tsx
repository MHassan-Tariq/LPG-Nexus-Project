import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms & Conditions - LPG Nexus",
  description: "Terms and Conditions for LPG Nexus Management System",
};

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-slate-900">📘 TERMS & CONDITIONS</h1>
            <p className="mt-2 text-lg text-slate-600">LPG NEXUS</p>
            <p className="mt-4 text-sm text-slate-500">Last Updated: December 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Software Info */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-900">Software Name:</p>
              <p className="text-lg font-bold text-blue-700">LPG Nexus</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">Owner:</p>
              <p className="text-lg text-blue-700">LPG Nexus (You/Admin)</p>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-blue-900">Contact:</p>
              <div className="space-y-1">
                <p className="text-blue-700">📧 lpgnexus1@gmail.com</p>
                <p className="text-blue-700">📞 0303-7771186</p>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By creating an account, logging in, or using the LPG Nexus software, you agree to comply with and be legally bound by these Terms & Conditions. If you do not agree, you must stop using the software immediately.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">2. Description of Service</h2>
              <p className="mb-3 leading-relaxed">
                LPG Nexus is an LPG business management system designed to help organizations manage:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Cylinder tracking</li>
                <li>Customer management</li>
                <li>Expenses & payments</li>
                <li>Reports & analytics</li>
                <li>Inventory & stock</li>
                <li>Staff accounts & permissions</li>
                <li>Backup & restore</li>
                <li>Super admin control panel</li>
                <li>OTP-based security features</li>
              </ul>
              <p className="mt-3 leading-relaxed">The software may include updates or new features over time.</p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">3. User Responsibilities</h2>
              <p className="mb-3 leading-relaxed">Users agree to:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Provide accurate information when creating accounts.</li>
                <li>Keep login credentials secure and confidential.</li>
                <li>Use the software in compliance with local laws and regulations.</li>
                <li>Not attempt to hack, modify, or disrupt the system.</li>
                <li>Not misuse any features such as data backup, deletion tools, or admin controls.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">4. Account Management & Access</h2>
              <h3 className="mb-2 text-lg font-semibold text-slate-800">4.1 Admin & Staff Accounts</h3>
              <p className="mb-3 leading-relaxed">
                Each account may have different permissions depending on role:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Admin</li>
                <li>Staff</li>
                <li>Branch Roles</li>
                <li>Super Admin</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-800">4.2 Super Admin Access</h3>
              <p className="mb-2 leading-relaxed">
                High-level features like:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>User removal</li>
                <li>Permission changes</li>
                <li>Access control</li>
                <li>Activity logs</li>
                <li>Database wipe/reset</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                are protected and require a Super Admin Access Code. Unauthorized access attempts may result in account suspension.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">5. Payments & Billing (If Applicable)</h2>
              <p className="mb-3 leading-relaxed">
                If any paid plans or premium features are introduced in the future:
              </p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>All charges will be communicated clearly.</li>
                <li>No hidden fees will be applied.</li>
                <li>Refund policies will follow local law and outlined guidelines.</li>
              </ul>
              <p className="mt-3 text-sm italic leading-relaxed text-slate-600">
                (Current version may be free, depending on your business model.)
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">6. Data Backup & Restore</h2>
              <p className="mb-3 leading-relaxed">LPG Nexus provides:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Data Backup (Download/Restore)</li>
                <li>Full System Reset (requires OTP verification)</li>
                <li>Secure cloud or local storage (based on setup)</li>
              </ul>
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900">Warning:</p>
                <p className="mt-2 text-sm leading-relaxed text-red-800">
                  The "Delete All Data" function permanently erases all stored records. This action cannot be undone and requires OTP verification sent to your registered email.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">7. Security</h2>
              <p className="mb-3 leading-relaxed">The system uses:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>OTP verification</li>
                <li>Email-based security</li>
                <li>Encrypted passwords</li>
                <li>Role-based permission management</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                However, no digital system is 100% secure. Users are responsible for protecting their devices and passwords.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">8. Limitation of Liability</h2>
              <p className="mb-3 leading-relaxed">LPG Nexus is not responsible for:</p>
              <ul className="ml-6 list-disc space-y-2 leading-relaxed">
                <li>Loss of data due to user mistakes</li>
                <li>Misuse of the "Delete All Data" feature</li>
                <li>Unauthorized access caused by weak passwords</li>
                <li>Losses caused by incorrect business entries (wrong amounts, customer numbers, etc.)</li>
                <li>Internet outages or server downtime</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                The user accepts all responsibility for how the software is used.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">9. Modifications to Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms at any time. Users will be notified of major changes via email or system notification.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">10. Contact Us</h2>
              <p className="mb-3 leading-relaxed">For any questions regarding these Terms:</p>
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

