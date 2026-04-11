/**
 * Phone notification — simulates a push notification after the call
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

interface PhoneNotificationProps {
  patientName: string;
  onOpen: () => void;
}

export default function PhoneNotification({ patientName, onOpen }: PhoneNotificationProps) {
  const { locale } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const title = locale === "fr"
    ? "Appel terminé avec Maude"
    : "Call finished with Maude";

  const body = locale === "fr"
    ? `${patientName}, consultez vos actions en attente et prenez rendez-vous avec vos professionnels de santé.`
    : `${patientName}, check your pending actions and book appointments with your healthcare professionals.`;

  const cta = locale === "fr" ? "Voir mes actions" : "View my actions";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      {/* Phone frame */}
      <div className="w-full max-w-sm">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 text-white/60 text-xs">
          <span>{time}</span>
          <div className="flex items-center gap-1">
            <span>●●●</span>
            <span>WiFi</span>
            <span>100%</span>
          </div>
        </div>

        {/* Lock screen wallpaper area */}
        <div className="flex flex-col items-center pt-12 pb-8">
          <p className="text-white/40 text-sm">{locale === "fr" ? "Notifications" : "Notifications"}</p>
          <p className="text-white text-4xl font-light mt-2">{time}</p>
        </div>

        {/* Notification card — slides in */}
        <div
          className={`mx-4 transition-all duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={onOpen}
            className="w-full text-left bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl hover:bg-white transition-colors"
          >
            {/* Notification header */}
            <div className="flex items-center gap-2.5 mb-2">
              <Image src="/maude.png" alt="Maude" width={28} height={28} className="rounded-lg" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#282830] uppercase tracking-wide">Alan</span>
                  <span className="text-xs text-[#9DA3BA]">{locale === "fr" ? "maintenant" : "now"}</span>
                </div>
              </div>
            </div>

            {/* Notification content */}
            <p className="text-sm font-semibold text-[#282830] mb-0.5">{title}</p>
            <p className="text-sm text-[#464754] leading-snug">{body}</p>

            {/* CTA */}
            <div className="mt-3 flex items-center justify-center gap-2 bg-[#5C59F3] text-white rounded-xl py-2.5 text-sm font-semibold">
              {cta}
            </div>
          </button>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-8">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
