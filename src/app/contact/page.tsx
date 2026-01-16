import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { ContactForm } from "@/components/contact/contact-form";

export default async function ContactPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <ContactForm />
        </main>
      </div>
    </div>
  );
}

