"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SoftwareProfileTab } from "@/components/settings/software-profile-tab";
import { BillDesigningTab } from "@/components/settings/bill-designing-tab";
import { ReportDesigningTab } from "@/components/settings/report-designing-tab";
import { PremiumOverviewTab } from "@/components/settings/premium-overview-tab";
import { ChatbotSettingsTab } from "@/components/settings/chatbot-settings-tab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SettingsTabsProps {
  initialSettings: {
    softwareName: string;
    softwareLogo: string | null;
  };
}

export function SettingsTabs({ initialSettings }: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full max-w-4xl grid-cols-5 rounded-xl bg-slate-100 p-1">
        <TabsTrigger 
          value="overview" 
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger 
          value="software-profile" 
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
        >
          Software Profile
        </TabsTrigger>
        <TabsTrigger 
          value="bill-designing"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
        >
          Bill Designing
        </TabsTrigger>
        <TabsTrigger 
          value="report-designing"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
        >
          Report Designing
        </TabsTrigger>
        <TabsTrigger 
          value="chatbot"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
        >
          Chatbot
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6">
        <PremiumOverviewTab />
      </TabsContent>
      
      <TabsContent value="software-profile" className="mt-6">
        <SoftwareProfileTab initialSettings={initialSettings} />
      </TabsContent>
      
      <TabsContent value="bill-designing" className="mt-6">
        <BillDesigningTab />
      </TabsContent>
      
      <TabsContent value="report-designing" className="mt-6">
        <ReportDesigningTab />
      </TabsContent>
      
      <TabsContent value="chatbot" className="mt-6">
        <ChatbotSettingsTab />
      </TabsContent>
    </Tabs>
  );
}

