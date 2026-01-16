import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

async function getLogoData() {
  try {
    const tenantFilter = await getTenantFilter();
    const [softwareName, softwareLogo] = await Promise.all([
      prisma.systemSettings.findFirst({
        where: {
          ...tenantFilter,
          key: "softwareName",
        },
      }),
      prisma.systemSettings.findFirst({
        where: {
          ...tenantFilter,
          key: "softwareLogo",
        },
      }),
    ]);

    return {
      name: softwareName?.value || "LPG Nexus",
      logo: softwareLogo?.value || null,
    };
  } catch {
    return {
      name: "LPG Nexus",
      logo: null,
    };
  }
}

export default async function NotFoundPage() {
  const logoData = await getLogoData();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-300 to-blue-100">
      {/* Clouds Background Image */}
      <div className="absolute inset-0 z-[1] overflow-hidden">
        <img
          src="/CLOUDS.png"
          alt="Clouds background"
          className="h-full w-full object-cover opacity-100"
        />
      </div>

      {/* LPG Nexus Logo - Top Left */}
      <div className="absolute left-8 top-8 z-30">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          {logoData.logo ? (
            <img
              src={logoData.logo}
              alt={logoData.name}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
              <span className="text-sm font-bold">LPG</span>
            </div>
          )}
          <span className="text-xl font-semibold text-slate-800">{logoData.name}</span>
        </Link>
      </div>

      {/* Large Semi-transparent 404 Numbers */}
      <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-8 select-none pointer-events-none z-[2]">
        {/* First 4 */}
        <span className="text-[35rem] font-black leading-none text-white/60 tracking-tight drop-shadow-lg">4</span>
        <span className="text-[35rem] font-black leading-none text-white/60 tracking-tight drop-shadow-lg">0</span>
        
        {/* Second 4 */}
        <span className="text-[35rem] font-black leading-none text-white/60 tracking-tight drop-shadow-lg">4</span>
      </div>
      
      {/* Monster in place of 0 - Using actual image */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[3] pointer-events-none">
        <div className="relative h-[45rem] w-[45rem]">
          <Image
            src="/CHARACTER.png"
            alt="Blue monster character"
            fill
            className="object-contain drop-shadow-2xl"
            priority
            sizes="720px"
          />
        </div>
      </div>

      {/* Main Content - Text and Button */}
      <div className="relative z-[4] mt-[32rem] flex flex-col items-center justify-center px-4 text-center">
        {/* Headline */}
        <h2 className="mb-4 text-5xl font-bold text-slate-800 md:text-6xl lg:text-7xl">
          Oops, I think we&apos;re lost...
        </h2>

        {/* Subtitle */}
        <p className="mb-10 text-xl text-slate-600 md:text-2xl lg:text-3xl">
          Let&apos;s get you back to somewhere familiar.
        </p>

        {/* Back Home Button */}
        <Link href="/">
          <Button
            size="lg"
            className="group h-14 gap-3 rounded-xl border-2 border-slate-300 bg-white px-8 text-base font-semibold text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
