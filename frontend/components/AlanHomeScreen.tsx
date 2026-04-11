/**
 * Alan Home Screen — mockup of the Alan MO app
 * Shows what the user sees before Maude calls
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { PatientProfile } from "@/lib/patients";
import LanguageSelector from "./LanguageSelector";

interface AlanHomeScreenProps {
  patient: PatientProfile;
  onIncomingCall: () => void;
}

export default function AlanHomeScreen({ patient, onIncomingCall }: AlanHomeScreenProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [showNotif, setShowNotif] = useState(false);

  // Simulate incoming call notification after 3s
  useEffect(() => {
    const timer = setTimeout(() => setShowNotif(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const firstName = patient.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      {/* Language selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Alan app header */}
      <div className="bg-white border-b border-[#ECF1FC] px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5C59F3] flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-lg font-bold text-[#282830]">alan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#FF9359] bg-[#FFF3E5] px-2.5 py-1 rounded-full">
              🫐 248 berries
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-6 py-6 space-y-5 flex-1">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-[#282830]">
            {isFr ? `Bonjour ${firstName} 👋` : `Hi ${firstName} 👋`}
          </h1>
          <p className="text-sm text-[#9DA3BA] mt-1">
            {isFr ? "Votre santé, simplifiée" : "Your health, simplified"}
          </p>
        </div>

        {/* Insurance card */}
        <div className="bg-gradient-to-br from-[#5C59F3] to-[#2F33A8] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{patient.plan}</span>
            <span className="text-xs opacity-60">alan</span>
          </div>
          <p className="font-bold text-lg">{patient.name}</p>
          <p className="text-sm opacity-70 mt-0.5">N° 2 86 05 75 115 042 68</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs opacity-60">{isFr ? "Tiers payant activé" : "Direct billing active"} ✓</span>
            <span className="text-xs opacity-60">Apple Wallet</span>
          </div>
        </div>

        {/* Mo assistant */}
        <div className="alan-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0F3FF] flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#282830]">Mo</p>
              <p className="text-xs text-[#9DA3BA]">
                {isFr ? "Posez vos questions santé, 9h-23h" : "Ask health questions, 9am-11pm"}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#2AA79C]" />
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="text-sm font-semibold text-[#9DA3BA] uppercase tracking-wider mb-3">
            {isFr ? "Activité récente" : "Recent activity"}
          </h2>

          <div className="alan-card p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBFAF9] flex items-center justify-center">
                <span className="text-lg">💊</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#282830]">
                  {isFr ? "Remboursement traité" : "Reimbursement processed"}
                </p>
                <p className="text-xs text-[#9DA3BA]">Ketoprofen 100mg · 12,50€ · 8 avr.</p>
              </div>
              <span className="text-xs font-semibold text-[#2AA79C]">✓</span>
            </div>
          </div>

          <div className="alan-card p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center">
                <span className="text-lg">{patient.emoji}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#282830]">
                  {isFr ? patient.eventDescription.replace("Right knee arthroscopy", "Arthroscopie genou droit") : patient.eventDescription}
                </p>
                <p className="text-xs text-[#9DA3BA]">{patient.eventDate}</p>
              </div>
            </div>
          </div>

          {/* Alan Walk */}
          <div className="alan-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3E5] flex items-center justify-center">
                <span className="text-lg">🚶‍♀️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#282830]">Alan Walk</p>
                <p className="text-xs text-[#9DA3BA]">
                  {isFr ? "2 100 pas aujourd'hui · Objectif 8 000" : "2,100 steps today · Goal 8,000"}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#FF9359]">+5 🫐</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          <button className="alan-card p-3 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xl">🗺️</span>
            <span className="text-xs text-[#464754] font-medium">Alan Map</span>
          </button>
          <button className="alan-card p-3 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xl">🏥</span>
            <span className="text-xs text-[#464754] font-medium">{isFr ? "Clinique" : "Clinic"}</span>
          </button>
          <button className="alan-card p-3 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xl">🛍️</span>
            <span className="text-xs text-[#464754] font-medium">Alan Shop</span>
          </button>
        </div>
      </div>

      {/* Incoming call notification — slides up after 3s */}
      {showNotif && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4 animate-[slideUp_0.5s_ease-out]">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-[#ECF1FC] overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <Image src="/maude.png" alt="Maude" width={48} height={48} className="rounded-full" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#2AA79C] rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-[#282830]">Maude</p>
                  <p className="text-sm text-[#9DA3BA]">
                    {isFr ? "Suivi santé · Alan" : "Health follow-up · Alan"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#2AA79C] animate-pulse flex items-center justify-center">
                  <span className="text-white text-lg">📞</span>
                </div>
              </div>
              <p className="text-sm text-[#464754] mb-4">
                {isFr
                  ? `${firstName}, je souhaite prendre de vos nouvelles suite à votre ${patient.eventDescription.toLowerCase().replace("right knee arthroscopy", "arthroscopie du genou")}.`
                  : `${firstName}, I'd like to check in on you after your ${patient.eventDescription.toLowerCase()}.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onIncomingCall}
                  className="flex-1 py-3 bg-[#2AA79C] hover:bg-[#1C6E67] text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  📞 {isFr ? "Accepter" : "Accept"}
                </button>
                <button className="flex-1 py-3 bg-[#F0F3FF] text-[#5C59F3] rounded-xl font-semibold text-sm hover:bg-[#D6DBFF] transition-colors">
                  {isFr ? "Reporter" : "Later"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="bg-white border-t border-[#ECF1FC] px-6 py-3 mt-auto">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-semibold text-[#5C59F3]">{isFr ? "Accueil" : "Home"}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg">💳</span>
            <span className="text-[10px] text-[#9DA3BA]">{isFr ? "Carte" : "Card"}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg">💰</span>
            <span className="text-[10px] text-[#9DA3BA]">{isFr ? "Remboursements" : "Claims"}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg">👤</span>
            <span className="text-[10px] text-[#9DA3BA]">{isFr ? "Profil" : "Profile"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
