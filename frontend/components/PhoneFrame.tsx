/**
 * iPhone frame wrapper — reusable phone mockup container
 *
 * Owner: Dev 3
 */

"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface PhoneFrameProps {
  children: ReactNode;
  bgClass?: string;
  showBranding?: boolean;
}

export default function PhoneFrame({ children, bgClass = "bg-gradient-to-br from-[#0C0A66] via-[#2F33A8] to-[#5C59F3]", showBranding = true }: PhoneFrameProps) {
  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-6 relative overflow-hidden`}>
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      {/* Branding left side (desktop) */}
      {showBranding && (
        <div className="hidden lg:flex flex-col items-start mr-16 max-w-xs">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/maude.png" alt="Maude" width={80} height={80} style={{ width: 80, height: "auto" }} className="rounded-2xl drop-shadow-lg" />
            <span className="text-3xl font-bold text-white tracking-tight">alan</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            HeyMo
          </h2>
          <p className="text-base text-white/50 leading-relaxed">
            Votre assistant santé vocal intelligent par Alan.
          </p>
        </div>
      )}

      {/* iPhone */}
      <div className="iphone-frame flex-shrink-0">
        <div className="iphone-notch" />
        <div className="iphone-home-bar" />
        <div className="iphone-screen bg-[#FFFCF5]">
          {children}
        </div>
      </div>
    </div>
  );
}
