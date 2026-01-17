import React from "react";
import { MarketingHero } from "@/components/marketing/hero";
import { MarketingFeatures } from "@/components/marketing/features";
import { MarketingPricing } from "@/components/marketing/pricing";
import { MarketingTestimonials } from "@/components/marketing/testimonials";
import { MarketingContact } from "@/components/marketing/contact";

export default function MarketingHomePage() {
  return (
    <>
      <MarketingHero />
      <MarketingFeatures />
      <MarketingPricing />
      <MarketingTestimonials />
      <MarketingContact />
    </>
  );
}
