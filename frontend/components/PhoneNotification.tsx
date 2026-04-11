/**
 * Phone notification — simulates a push notification after the call
 * Inside iPhone frame mockup
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import PhoneFrame from "./PhoneFrame";

interface PhoneNotificationProps {
  patientName: string;
  onOpen: () => void;
}

export default function PhoneNotification({ patientName, onOpen }: PhoneNotificationProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const title = isFr ? "Appel terminé avec Maude" : "Call finished with Maude";
  const body = isFr
    ? `${patientName}, consultez vos actions en attente et prenez rendez-vous avec vos professionnels de santé.`
    : `${patientName}, check your pending actions and book appointments with your healthcare professionals.`;
  const cta = isFr ? "Voir mes actions" : "View my actions";

  return (
    <PhoneFrame bgClass="bg-[#0a0a0a]" showBranding={false}>
      {/* Lock screen */}
      <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] relative">
        {/* Status bar */}
        <div className="flex items-center justify-between px-7 pt-4 pb-1">
          <span className="text-[11px] font-semibold text-white/60">{time}</span>
          <div className="flex items-center gap-1.5 opacity-60">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="white"><rect x="0" y="6" width="3" height="6" rx="0.5"/><rect x="4.5" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="1" width="3" height="11" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/></svg>
            <svg width="22" height="10" viewBox="0 0 25 12" fill="white"><rect x="0" y="1" width="21" height="10" rx="2" stroke="white" strokeWidth="1" fill="none"/><rect x="22" y="4" width="2" height="4" rx="0.5"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="white"/></svg>
          </div>
        </div>

        {/* Time display */}
        <div className="flex flex-col items-center pt-16 pb-8">
          <p className="text-white/30 text-xs tracking-wider uppercase">
            {isFr ? "Notifications" : "Notifications"}
          </p>
          <p className="text-white text-5xl font-extralight mt-3 tracking-wide">{time}</p>
        </div>

        {/* Notification card */}
        <div className={`mx-5 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <button onClick={onOpen} className="w-full text-left bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl active:scale-[0.98] transition-transform">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <Image src="/maude.png" alt="Maude" width={28} height={28} style={{ width: 28, height: 28 }} className="rounded-lg" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#282830] uppercase tracking-wide">Alan</span>
                  <span className="text-[10px] text-[#9DA3BA]">{isFr ? "maintenant" : "now"}</span>
                </div>
              </div>
            </div>
            {/* Content */}
            <p className="text-xs font-semibold text-[#282830] mb-0.5">{title}</p>
            <p className="text-[11px] text-[#464754] leading-snug">{body}</p>
            {/* CTA */}
            <div className="mt-3 flex items-center justify-center gap-2 bg-[#5C59F3] text-white rounded-xl py-2.5 text-xs font-semibold">
              {cta}
            </div>
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
