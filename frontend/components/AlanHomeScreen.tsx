/**
 * Alan Home Screen — faithful mockup of the real Alan MO app
 * Based on actual 2026 app screenshots
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { PatientProfile } from "@/lib/patients";
import LanguageSelector from "./LanguageSelector";
import PhoneFrame from "./PhoneFrame";

interface AlanHomeScreenProps {
  patient: PatientProfile;
  onIncomingCall: () => void;
}

export default function AlanHomeScreen({ patient, onIncomingCall }: AlanHomeScreenProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [showNotif, setShowNotif] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [time, setTime] = useState("12:58");
  const [activeTab, setActiveTab] = useState<"today" | "consult" | "insurance" | "essentials">("today");

  useEffect(() => {
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    const timer = setTimeout(() => setShowNotif(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const firstName = patient.name.split(" ")[0];

  return (
    <div className="relative">
      {/* Language selector outside phone */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <PhoneFrame bgClass="bg-gradient-to-br from-[#0C0A66] via-[#2F33A8] to-[#5C59F3]">
        {/* iOS status bar */}
        <div className="flex items-center justify-between px-7 pt-3.5 pb-1 bg-transparent absolute top-0 left-0 right-0 z-10">
          <span className="text-[11px] font-semibold text-[#282830]">{time}</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="#282830"><rect x="0" y="6" width="3" height="6" rx="0.5"/><rect x="4.5" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="1" width="3" height="11" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/></svg>
            <svg width="14" height="10" viewBox="0 0 15 12" fill="#282830"><path d="M7.5 3.6C9.3 3.6 10.9 4.3 12 5.5L13.4 4.1C11.9 2.5 9.8 1.5 7.5 1.5S3.1 2.5 1.6 4.1L3 5.5C4.1 4.3 5.7 3.6 7.5 3.6Z" opacity="0.3"/><path d="M7.5 6.6C8.7 6.6 9.7 7.1 10.5 7.9L11.9 6.5C10.7 5.3 9.2 4.5 7.5 4.5S4.3 5.3 3.1 6.5L4.5 7.9C5.3 7.1 6.3 6.6 7.5 6.6Z"/><circle cx="7.5" cy="10.5" r="1.5"/></svg>
            <svg width="22" height="10" viewBox="0 0 25 12" fill="#282830"><rect x="0" y="1" width="21" height="10" rx="2" stroke="#282830" strokeWidth="1" fill="none"/><rect x="22" y="4" width="2" height="4" rx="0.5"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="#2AA79C"/></svg>
          </div>
        </div>

        {/* App content */}
        <div className="pt-9 pb-16 h-full overflow-y-auto">
          {/* Top bar — avatar + search + button */}
          <div className="px-5 py-2 flex items-center gap-3">
            {/* User avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFE0C2] to-[#FECBA1] flex items-center justify-center text-sm shrink-0 border-2 border-white shadow-sm">
              👩
            </div>
            {/* Search bar */}
            <div className="flex-1 bg-[#F5F5F5] rounded-full px-4 py-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9DA3BA" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span className="text-xs text-[#9DA3BA]">Search</span>
            </div>
            {/* Blue dot button */}
            <div className="w-9 h-9 rounded-full bg-[#5C59F3] flex items-center justify-center shrink-0 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg>
            </div>
          </div>

          {/* Today tab content */}
          {activeTab === "today" && (
            <div>
              {/* Gradient header with marmot */}
              <div className="mx-4 mt-2 rounded-3xl bg-gradient-to-br from-[#FFE8D6] via-[#FFDBC4] to-[#FFD0B0] p-5 pb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />

                {/* Marmot + berries area */}
                <div className="flex flex-col items-center">
                  <p className="text-[10px] text-[#8B6914] font-medium bg-[#FFE8A3]/60 px-3 py-1 rounded-full mb-3">
                    {isFr ? "Validez vos pas" : "Tap to validate your steps"}
                  </p>
                  <Image src="/maude.png" alt="Maude" width={90} height={90} style={{ width: 90, height: "auto" }} className="drop-shadow-lg mb-2" />
                  <p className="text-2xl font-bold text-[#282830]">{isFr ? "0 berries aujourd'hui" : "0 berries today"}</p>
                  <p className="text-xs text-[#656779] mt-0.5">3 177 {isFr ? "pas" : "steps"}</p>
                </div>
              </div>

              {/* Step duels */}
              <div className="px-5 mt-5">
                <h3 className="text-sm font-bold text-[#282830] mb-3">{isFr ? "Duels de pas" : "Step duels"}</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <div className="bg-white rounded-2xl border border-[#ECF1FC] p-3 min-w-[160px] shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#282830] truncate">Challenge Ana...</span>
                      <div className="w-6 h-6 rounded-full bg-[#FFE0C2] flex items-center justify-center text-[10px]">👩</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#9DA3BA]">
                      <span>⏱ 24h</span>
                      <span>🫐 100 - 1000</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#ECF1FC] p-3 min-w-[160px] shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#282830] truncate">Challenge Mar...</span>
                      <div className="w-6 h-6 rounded-full bg-[#D6DBFF] flex items-center justify-center text-[10px]">👨</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#9DA3BA]">
                      <span>⏱ 24h</span>
                      <span>🫐 50 - 500</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#5C59F3] font-semibold mt-2">{isFr ? "+ 1000 prix à gagner >" : "+ 1000 prizes to be won >"}</p>
              </div>

              {/* Challenges */}
              <div className="px-5 mt-5">
                <h3 className="text-sm font-bold text-[#282830] mb-3">{isFr ? "Défis" : "Challenges"}</h3>
                <div className="bg-[#0C3B2E] rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{isFr ? "Apaiser son esprit" : "Soothe your mind"}</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{isFr ? "Gardez l'esprit clair" : "Keep a clear mind"}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-white/40">100 🫐</span>
                    </div>
                  </div>
                  <div className="text-3xl">🧘</div>
                </div>
              </div>

              <div className="h-4" />
            </div>
          )}

          {/* Consult tab */}
          {activeTab === "consult" && (
            <div className="px-5 mt-3">
              {/* Top cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl border border-[#ECF1FC] p-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] flex items-center justify-center mb-2">
                    <Image src="/maude.png" alt="Maude" width={28} height={28} style={{ width: 28, height: 28 }} className="rounded-full" />
                  </div>
                  <p className="text-xs font-semibold text-[#282830]">{isFr ? "Parler à l'équipe médicale" : "Talk with our medical team"}</p>
                  <p className="text-[10px] text-[#9DA3BA] mt-0.5">{isFr ? "24/7, chat ou vidéo" : "24/7 chat or video"}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#ECF1FC] p-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EBFAF9] flex items-center justify-center mb-2">
                    <span className="text-lg">📍</span>
                  </div>
                  <p className="text-xs font-semibold text-[#282830]">{isFr ? "Trouver un pro" : "Find a professional"}</p>
                  <p className="text-[10px] text-[#9DA3BA] mt-0.5">{isFr ? "Proche, bien remboursé" : "Nearby, well reimbursed"}</p>
                </div>
              </div>

              {/* More resources */}
              <h3 className="text-sm font-bold text-[#282830] mb-3">{isFr ? "Ressources" : "More resources"}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: isFr ? "Esprit" : "Mind", emoji: "🧘", bg: "bg-[#E8F5E9]" },
                  { label: isFr ? "Dos" : "Back pain", emoji: "⚡", bg: "bg-[#FFF3E0]" },
                  { label: isFr ? "Sommeil" : "Sleep", emoji: "😴", bg: "bg-[#E3F2FD]" },
                  { label: isFr ? "Nutrition" : "Nutrition", emoji: "🥕", bg: "bg-[#FFF8E1]" },
                  { label: isFr ? "Peau" : "Skin", emoji: "✨", bg: "bg-[#FCE4EC]" },
                  { label: isFr ? "Femme" : "Woman", emoji: "💗", bg: "bg-[#F3E5F5]" },
                ].map((r, i) => (
                  <div key={i} className={`${r.bg} rounded-2xl p-3 flex items-center justify-between`}>
                    <span className="text-xs font-semibold text-[#282830]">{r.label}</span>
                    <span className="text-lg">{r.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance tab */}
          {activeTab === "insurance" && (
            <div className="px-5 mt-3">
              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: "📄", label: isFr ? "Envoyer un document" : "Send a document" },
                  { icon: "💙", label: isFr ? "Ma couverture" : "See my coverage" },
                  { icon: "🏥", label: isFr ? "Hospitalisation" : "Hospital stay" },
                ].map((a, i) => (
                  <div key={i} className="bg-[#F0F3FF] rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 rounded-xl bg-[#5C59F3] flex items-center justify-center text-sm text-white">{a.icon}</div>
                    <span className="text-[9px] font-medium text-[#282830] leading-tight">{a.label}</span>
                  </div>
                ))}
              </div>

              {/* Alan card */}
              <div className="bg-white rounded-2xl border border-[#ECF1FC] p-4 flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-[#282830]">{isFr ? "Ma carte Alan" : "My Alan card"}</span>
                <Image src="/maude.png" alt="Maude" width={36} height={36} style={{ width: 36, height: 36 }} className="rounded-full" />
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-[#ECF1FC] mb-4">
                <span className="text-xs font-semibold text-[#282830] pb-2 border-b-2 border-[#282830]">{isFr ? "Soins" : "Care events"}</span>
                <span className="text-xs text-[#9DA3BA] pb-2">Documents</span>
                <span className="text-xs text-[#9DA3BA] pb-2">{isFr ? "Virements" : "Transfers"}</span>
              </div>

              {/* Empty state */}
              <div className="flex flex-col items-center py-8">
                <div className="text-3xl mb-3 opacity-30">📋</div>
                <p className="text-sm font-semibold text-[#282830]">{isFr ? "Aucun soin remboursé" : "No reimbursed cares yet"}</p>
                <p className="text-[10px] text-[#9DA3BA] mt-1 text-center">{isFr ? "Vos remboursements apparaîtront ici" : "Once we reimburse a care, it will appear here."}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom tab bar — fixed */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#ECF1FC] px-2 pt-2 pb-6 z-30">
          <div className="flex items-center justify-around">
            {([
              { id: "today", icon: "🏠", label: isFr ? "Aujourd'hui" : "Today" },
              { id: "consult", icon: "🩺", label: isFr ? "Consulter" : "Consult" },
              { id: "insurance", icon: "🛡️", label: isFr ? "Assurance" : "Insurance" },
              { id: "essentials", icon: "🧩", label: isFr ? "Essentiels" : "Essentials" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-0.5 min-w-[60px]"
              >
                <span className={`text-base ${activeTab === tab.id ? "" : "opacity-40"}`}>{tab.icon}</span>
                <span className={`text-[9px] font-medium ${activeTab === tab.id ? "text-[#5C59F3]" : "text-[#9DA3BA]"}`}>{tab.label}</span>
              </button>
            ))}
            {/* Profile marmot */}
            <button className="flex flex-col items-center gap-0.5 min-w-[40px]">
              <Image src="/maude.png" alt="Profile" width={22} height={22} style={{ width: 22, height: 22 }} className="rounded-full" />
            </button>
          </div>
        </div>

        {/* Missed call banner — shows after dismissing notification */}
        {notifDismissed && !showNotif && (
          <div className="absolute top-12 inset-x-3 z-40">
            <button
              onClick={() => { setNotifDismissed(false); setShowNotif(true); }}
              className="w-full bg-[#F0F3FF] rounded-2xl p-3 flex items-center gap-3 border border-[#D6DBFF] shadow-sm active:scale-[0.98] transition-transform"
            >
              <Image src="/maude.png" alt="Maude" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-[#282830]">Maude · {isFr ? "Appel manqué" : "Missed call"}</p>
                <p className="text-[10px] text-[#5C59F3]">{isFr ? "Appuyer pour rappeler" : "Tap to call back"}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2AA79C] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
            </button>
          </div>
        )}

        {/* Incoming call notification — inside phone */}
        {showNotif && !notifDismissed && (
          <div className="absolute inset-x-3 bottom-20 z-40 animate-[slideUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#ECF1FC] overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="relative">
                    <Image src="/maude.png" alt="Maude" width={44} height={44} style={{ width: 44, height: 44 }} className="rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2AA79C] rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#282830]">Maude</p>
                    <p className="text-[11px] text-[#9DA3BA]">
                      {isFr ? "Suivi santé · Alan" : "Health follow-up · Alan"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#2AA79C] flex items-center justify-center" style={{ animation: "ringPulse 2s ease-in-out infinite" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  </div>
                </div>
                <p className="text-xs text-[#464754] mb-3 leading-relaxed">
                  {isFr
                    ? `${firstName}, je souhaite prendre de vos nouvelles suite à votre arthroscopie du genou.`
                    : `${firstName}, I'd like to check in on you after your knee arthroscopy.`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onIncomingCall}
                    className="flex-1 py-2.5 bg-[#2AA79C] hover:bg-[#1C6E67] text-white rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    {isFr ? "Accepter" : "Accept"}
                  </button>
                  <button
                    onClick={() => { setShowNotif(false); setNotifDismissed(true); }}
                    className="flex-1 py-2.5 bg-[#F0F3FF] text-[#5C59F3] rounded-xl font-semibold text-xs hover:bg-[#D6DBFF] transition-all active:scale-95"
                  >
                    {isFr ? "Reporter" : "Later"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
