/**
 * Alan Home Screen — pixel-faithful mockup of the real Alan MO app
 * Based on actual 2026 app screenshots
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { PatientProfile } from "@/lib/patients";
import { CallSummary } from "@/lib/types";
import LanguageSelector from "./LanguageSelector";
import PhoneFrame from "./PhoneFrame";

interface AlanHomeScreenProps {
  patient: PatientProfile;
  onIncomingCall: () => void;
  lastSummary?: CallSummary | null;
}

/* ─── SVG Icons matching the real Alan app ─── */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"
      fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <rect x="9" y="14" width="6" height="7" rx="0.5" fill={active ? "white" : "none"} stroke={active ? "white" : "#B4BCD3"} strokeWidth="1.2"/>
  </svg>
);

const ConsultIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="10" r="3" stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <path d="M12 16c-4 0-6 2-6 3v1h12v-1c0-1-2-3-6-3z" stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8" fill={active ? "#5C59F3" : "none"}/>
    <circle cx="18" cy="7" r="2.5" fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.5"/>
    <path d="M17 7h2M18 6v2" stroke={active ? "white" : "#B4BCD3"} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const InsuranceIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3L4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4z"
      fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <path d="M9 12l2 2 4-4" stroke={active ? "white" : "#B4BCD3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EssentialsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="2" fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <rect x="13" y="4" width="7" height="7" rx="2" fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <rect x="4" y="13" width="7" height="7" rx="2" fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
    <rect x="13" y="13" width="7" height="7" rx="2" fill={active ? "#5C59F3" : "none"} stroke={active ? "#5C59F3" : "#B4BCD3"} strokeWidth="1.8"/>
  </svg>
);

export default function AlanHomeScreen({ patient, onIncomingCall, lastSummary }: AlanHomeScreenProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [showNotif, setShowNotif] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [time, setTime] = useState("12:58");
  const [activeTab, setActiveTab] = useState<"today" | "consult" | "insurance" | "essentials" | "maude">("today");

  useEffect(() => {
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
    const timer = setTimeout(() => setShowNotif(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const firstName = patient.name.split(" ")[0];

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <PhoneFrame bgClass="bg-gradient-to-br from-[#0C0A66] via-[#2F33A8] to-[#5C59F3]">
        {/* iOS status bar */}
        <div className="flex items-center justify-between px-7 pt-3.5 pb-0.5 absolute top-0 left-0 right-0 z-10">
          <span className="text-[11px] font-semibold text-[#282830]">{time}</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="#282830"><rect x="0" y="6" width="3" height="6" rx="0.5"/><rect x="4.5" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="1" width="3" height="11" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/></svg>
            <svg width="14" height="10" viewBox="0 0 15 12" fill="#282830"><path d="M7.5 3.6C9.3 3.6 10.9 4.3 12 5.5L13.4 4.1C11.9 2.5 9.8 1.5 7.5 1.5S3.1 2.5 1.6 4.1L3 5.5C4.1 4.3 5.7 3.6 7.5 3.6Z" opacity="0.3"/><path d="M7.5 6.6C8.7 6.6 9.7 7.1 10.5 7.9L11.9 6.5C10.7 5.3 9.2 4.5 7.5 4.5S4.3 5.3 3.1 6.5L4.5 7.9C5.3 7.1 6.3 6.6 7.5 6.6Z"/><circle cx="7.5" cy="10.5" r="1.5"/></svg>
            <svg width="22" height="10" viewBox="0 0 25 12" fill="#282830"><rect x="0" y="1" width="21" height="10" rx="2" stroke="#282830" strokeWidth="1" fill="none"/><rect x="22" y="4" width="2" height="4" rx="0.5"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="#2AA79C"/></svg>
          </div>
        </div>

        <div className="pt-9 pb-16 h-full overflow-y-auto">
          {/* Top bar — avatar + search + blue button */}
          <div className="px-4 py-2 flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden shrink-0 shadow-sm">
              <Image src="/maude.png" alt="Profile" width={34} height={34} style={{ width: 34, height: 34 }} className="object-cover" />
            </div>
            <div className="flex-1 bg-[#F2F2F4] rounded-full px-3.5 py-[7px] flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
              <span className="text-[13px] text-[#8E8E93]">Search</span>
            </div>
            <div className="w-[34px] h-[34px] rounded-full bg-[#5C59F3] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
          </div>

          {/* ─── TODAY TAB ─── */}
          {activeTab === "today" && (
            <div>
              <div className="mx-3 mt-1 rounded-[24px] overflow-hidden" style={{ background: "linear-gradient(180deg, #FFE4CE 0%, #FFDBB8 40%, #FFD0A5 100%)" }}>
                <div className="flex flex-col items-center pt-4 pb-5 px-5 relative">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[160px] h-[80px] border-t-[3px] border-l-[3px] border-r-[3px] border-[#F5A623]/20 rounded-t-full" />
                  <p className="text-[10px] text-[#8B6914] font-medium bg-[#FFE8A3]/70 px-3 py-1 rounded-full mb-2 z-10">{isFr ? "Validez vos pas >" : "Tap to validate your steps >"}</p>
                  <div className="relative z-10 mb-1">
                    <Image src="/maude.png" alt="Maude" width={100} height={100} style={{ width: 100, height: "auto" }} className="drop-shadow-lg" />
                  </div>
                  <p className="text-[22px] font-bold text-[#282830] mt-1">{isFr ? "567 berries aujourd'hui" : "567 berries today"}</p>
                  <p className="text-[13px] text-[#6B5C3E]/60 mt-0.5">3 177 {isFr ? "pas" : "steps"}</p>
                </div>
              </div>

              <div className="px-4 mt-5">
                <h3 className="text-[15px] font-bold text-[#282830] mb-2.5">{isFr ? "Duels de pas" : "Step duels"}</h3>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {[{ name: "Challenge Ana...", emoji: "👩", bg: "from-[#FFE0C2] to-[#FECBA1]", pts: "100 - 1000" }, { name: "Challenge Kylian...", emoji: "👨", bg: "from-[#D6DBFF] to-[#C4C9FF]", pts: "100 - 1000" }].map((d, i) => (
                    <div key={i} className="bg-white rounded-[18px] border border-[#F0F0F2] p-3 min-w-[155px] shrink-0 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[13px] font-semibold text-[#282830] truncate flex-1">{d.name}</span>
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${d.bg} flex items-center justify-center text-xs`}>{d.emoji}</div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8E8E93]"><span>⏱ 24h</span><span>🫐 {d.pts}</span></div>
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-[#5C59F3] font-semibold mt-2.5">{isFr ? "+ 1000 prix à gagner  >" : "+ 1000 prizes to be won  >"}</p>
              </div>

              <div className="px-4 mt-5">
                <h3 className="text-[15px] font-bold text-[#282830] mb-2.5">{isFr ? "Défis" : "Challenges"}</h3>
                <div className="bg-[#1A3A2A] rounded-[18px] p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-white">{isFr ? "Apaiser son esprit" : "Soothe your mind"}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">{isFr ? "Gardez l'esprit clair" : "Keep a clear mind"} · · </p>
                    <p className="text-[11px] text-white/40 mt-1.5">100 🫐</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">🧘</div>
                </div>
              </div>
              <div className="h-6" />
            </div>
          )}

          {/* ─── CONSULT TAB ─── */}
          {activeTab === "consult" && (
            <div className="px-4 mt-2">
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-white rounded-[18px] border border-[#F0F0F2] p-3.5 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden"><Image src="/maude.png" alt="Team" width={40} height={40} style={{ width: 40, height: 40 }} /></div>
                    <span className="text-[10px] font-bold text-white bg-[#5C59F3] px-1.5 py-0.5 rounded-full">+200</span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#282830] leading-snug">{isFr ? "Parler à l'équipe médicale" : "Talk with our medical team"}</p>
                  <p className="text-[10px] text-[#8E8E93] mt-1">{isFr ? "24/7, chat ou vidéo, couvert" : "24/7 chat or video, covered"}</p>
                </div>
                <div className="bg-white rounded-[18px] border border-[#F0F0F2] p-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#E8F8F5] flex items-center justify-center mb-2.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="#2AA79C" strokeWidth="2"/><path d="M12 2C7.6 2 4 5.4 4 9.5 4 16 12 22 12 22s8-6 8-12.5C20 5.4 16.4 2 12 2z" stroke="#2AA79C" strokeWidth="1.5"/></svg>
                  </div>
                  <p className="text-[12px] font-semibold text-[#282830] leading-snug">{isFr ? "Trouver un professionnel" : "Find a professional"}</p>
                  <p className="text-[10px] text-[#8E8E93] mt-1">{isFr ? "Proche, bien remboursé" : "Nearby, well reimbursed"}</p>
                </div>
              </div>

              <h3 className="text-[15px] font-bold text-[#282830] mb-2.5">Programs</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="rounded-[18px] bg-[#1A2F4A] h-[140px] relative shadow-sm overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[12px] font-semibold text-white">{isFr ? "Décoder votre santé" : "Decode your health"}</p>
                    <p className="text-[9px] text-white/60 mt-0.5">{isFr ? "Bilan sanguin avancé" : "Advanced blood testing"}</p>
                    <span className="inline-block mt-1.5 text-[9px] text-[#8E8E93] bg-white/90 px-2 py-0.5 rounded-full">✓ {isFr ? "En attente" : "On the waitlist"}</span>
                  </div>
                </div>
                <div className="rounded-[18px] bg-[#F5F0EA] h-[140px] relative shadow-sm overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[12px] font-semibold text-[#282830]">{isFr ? "Réduire le stress" : "Reduce stress"}</p>
                    <p className="text-[9px] text-[#8E8E93] mt-0.5">{isFr ? "Techniques scientifiques" : "Scientifically proven"}</p>
                    <span className="inline-block mt-1.5 text-[10px] text-[#5C59F3] font-semibold bg-white px-3 py-1 rounded-full border border-[#5C59F3]">{isFr ? "Continuer" : "Continue"}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-[15px] font-bold text-[#282830] mb-2.5">{isFr ? "Plus de ressources" : "More resources"}</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: isFr ? "Esprit" : "Mind", emoji: "🪷", bg: "#E8F5E9", color: "#2E7D32" },
                  { label: isFr ? "Mal de dos" : "Back pain", emoji: "⚡", bg: "#FFF3E0", color: "#E65100" },
                  { label: isFr ? "Sommeil" : "Sleep", emoji: "🌙", bg: "#E3F2FD", color: "#1565C0" },
                  { label: isFr ? "Nutrition" : "Nutrition", emoji: "🥕", bg: "#FFF8E1", color: "#F57F17" },
                  { label: isFr ? "Peau" : "Skin", emoji: "✨", bg: "#FCE4EC", color: "#AD1457" },
                  { label: isFr ? "Bébé" : "Baby", emoji: "🍐", bg: "#FFF3E0", color: "#E65100" },
                  { label: isFr ? "Sexualité" : "Sex", emoji: "💗", bg: "#F3E5F5", color: "#7B1FA2" },
                  { label: isFr ? "Femme" : "Woman", emoji: "🌺", bg: "#FFEBEE", color: "#C62828" },
                ].map((r, i) => (
                  <div key={i} className="rounded-[14px] px-3.5 py-3 flex items-center justify-between" style={{ backgroundColor: r.bg }}>
                    <span className="text-[13px] font-semibold" style={{ color: r.color }}>{r.label}</span>
                    <span className="text-[18px]">{r.emoji}</span>
                  </div>
                ))}
              </div>
              <div className="h-6" />
            </div>
          )}

          {/* ─── INSURANCE TAB ─── */}
          {activeTab === "insurance" && (
            <div className="px-4 mt-2">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="1.5" stroke="white" strokeWidth="1.8"/><path d="M9 7h6M9 11h6M9 15h3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>, label: isFr ? "Envoyer un document" : "Send a document" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke="white" strokeWidth="1.8"/></svg>, label: isFr ? "Voir ma couverture" : "See my coverage" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="2" stroke="white" strokeWidth="1.8"/><path d="M3 10h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>, label: isFr ? "Hospitalisation" : "Hospital stay" },
                ].map((a, i) => (
                  <div key={i} className="bg-[#F0F0FF] rounded-[16px] p-3 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-[10px] bg-[#5C59F3] flex items-center justify-center">{a.icon}</div>
                    <span className="text-[10px] font-medium text-[#282830] text-center leading-tight">{a.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[18px] border border-[#F0F0F2] p-3.5 flex items-center justify-between mb-4 shadow-sm">
                <span className="text-[14px] font-semibold text-[#282830]">{isFr ? "Ma carte Alan" : "My Alan card"}</span>
                <div className="flex -space-x-2">
                  <Image src="/maude.png" alt="" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full border-2 border-white" />
                  <Image src="/maude.png" alt="" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full border-2 border-white opacity-60" />
                </div>
              </div>

              <div className="flex gap-5 border-b border-[#F0F0F2] mb-5">
                {[{ l: isFr ? "Soins" : "Care events", a: true }, { l: "Documents", a: false }, { l: isFr ? "Virements" : "Transfers", a: false }, { l: isFr ? "Arrêts" : "Sick leaves", a: false }].map((t, i) => (
                  <span key={i} className={`text-[12px] pb-2.5 ${t.a ? "font-semibold text-[#282830] border-b-2 border-[#282830]" : "text-[#8E8E93]"}`}>{t.l}</span>
                ))}
              </div>

              <div className="flex flex-col items-center py-10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01"/></svg>
                <p className="text-[14px] font-semibold text-[#282830] mt-3">{isFr ? "Aucun soin remboursé" : "No reimbursed cares yet"}</p>
                <p className="text-[11px] text-[#8E8E93] mt-1 text-center px-8">{isFr ? "Vos remboursements apparaîtront ici." : "Once we reimburse a care, it will appear here."}</p>
              </div>
            </div>
          )}

          {/* ─── ESSENTIALS TAB ─── */}
          {activeTab === "essentials" && (
            <div className="px-4 mt-2">
              <h3 className="text-[15px] font-bold text-[#282830] mb-3">{isFr ? "Essentiels santé" : "Health essentials"}</h3>
              {[
                { icon: "🩺", title: isFr ? "Clinique Alan" : "Alan Clinic", desc: isFr ? "Consultez sans RDV, 7j/7" : "No appointment, 7 days a week" },
                { icon: "🗺️", title: "Alan Map", desc: isFr ? "Trouvez un praticien proche" : "Find a nearby practitioner" },
                { icon: "📱", title: isFr ? "Téléconsultation" : "Teleconsultation", desc: isFr ? "Parlez à un médecin maintenant" : "Talk to a doctor now" },
                { icon: "🛍️", title: "Alan Shop", desc: isFr ? "Produits santé & bien-être" : "Health & wellness products" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 flex items-center gap-3 mb-2 shadow-sm">
                  <div className="w-10 h-10 rounded-[12px] bg-[#F0F3FF] flex items-center justify-center text-lg shrink-0">{item.icon}</div>
                  <div><p className="text-[13px] font-semibold text-[#282830]">{item.title}</p><p className="text-[10px] text-[#8E8E93] mt-0.5">{item.desc}</p></div>
                </div>
              ))}
            </div>
          )}

          {/* ─── MAUDE TAB — last call history ─── */}
          {activeTab === "maude" && (
            <div className="px-4 mt-2">
              {/* Maude profile header */}
              <div className="flex flex-col items-center py-4">
                <Image src="/maude.png" alt="Maude" width={70} height={70} style={{ width: 70, height: "auto" }} className="rounded-full drop-shadow-lg mb-2" />
                <p className="text-[16px] font-bold text-[#282830]">Maude</p>
                <p className="text-[11px] text-[#8E8E93]">{isFr ? "Votre assistante santé Alan" : "Your Alan health assistant"}</p>
              </div>

              {lastSummary ? (
                <div className="space-y-2.5">
                  {/* Last call info */}
                  <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-bold text-[#282830]">{isFr ? "Dernier appel" : "Last call"}</p>
                      <span className="text-[10px] text-[#8E8E93]">{lastSummary.date}</span>
                    </div>
                    <p className="text-[11px] text-[#3C3C43] leading-relaxed">{lastSummary.summary}</p>

                    {/* Alert badge */}
                    <div className={`mt-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                      lastSummary.alert_level === "green" ? "bg-[#EBFAF9] text-[#1C6E67]" :
                      lastSummary.alert_level === "orange" ? "bg-[#FFF3E0] text-[#E65100]" :
                      "bg-[#FFEBEE] text-[#C62828]"
                    }`}>
                      {lastSummary.alert_level === "green" ? "✅" : lastSummary.alert_level === "orange" ? "⚠️" : "🚨"}
                      {lastSummary.alert_level === "green" ? (isFr ? "Tout va bien" : "All clear") :
                       lastSummary.alert_level === "orange" ? (isFr ? "Attention requise" : "Needs attention") :
                       (isFr ? "Urgent" : "Urgent")}
                    </div>
                  </div>

                  {/* Actions from last call */}
                  {lastSummary.actions.length > 0 && (
                    <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
                      <p className="text-[12px] font-bold text-[#282830] mb-2">{isFr ? "Actions en attente" : "Pending actions"}</p>
                      {lastSummary.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#F5F5F7] last:border-0">
                          <span className="text-[12px] mt-0.5">
                            {action.type === "appointment" ? "📅" : action.type === "followup_call" ? "📞" : "🚩"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] text-[#282830]">{action.description}</p>
                            {action.scheduled_date && (
                              <p className="text-[10px] text-[#8E8E93]">{action.scheduled_date}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medications */}
                  {lastSummary.medications_status.some((m) => m.status === "in_progress") && (
                    <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
                      <p className="text-[12px] font-bold text-[#282830] mb-2">💊 {isFr ? "Médicaments en cours" : "Current medications"}</p>
                      {lastSummary.medications_status.filter((m) => m.status === "in_progress").map((med, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F5F5F7] last:border-0">
                          <p className="text-[11px] text-[#282830]">{med.name}</p>
                          {med.remaining_days !== undefined && (
                            <span className="text-[10px] text-[#8E8E93]">{med.remaining_days}j</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wearable highlights */}
                  {lastSummary.wearable_highlights && (
                    <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
                      <p className="text-[12px] font-bold text-[#282830] mb-2">⌚ {isFr ? "Données santé" : "Health data"}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {lastSummary.wearable_highlights.resting_hr && (
                          <div className="bg-[#F0F0FF] rounded-[10px] p-2 text-center">
                            <p className="text-[9px] text-[#8E8E93]">❤️ BPM</p>
                            <p className="text-[14px] font-bold text-[#282830]">{lastSummary.wearable_highlights.resting_hr.value}</p>
                          </div>
                        )}
                        {lastSummary.wearable_highlights.sleep_hours && (
                          <div className="bg-[#F0F0FF] rounded-[10px] p-2 text-center">
                            <p className="text-[9px] text-[#8E8E93]">🌙 {isFr ? "Sommeil" : "Sleep"}</p>
                            <p className="text-[14px] font-bold text-[#282830]">{lastSummary.wearable_highlights.sleep_hours.value}h</p>
                          </div>
                        )}
                        {lastSummary.wearable_highlights.steps && (
                          <div className="bg-[#F0F0FF] rounded-[10px] p-2 text-center">
                            <p className="text-[9px] text-[#8E8E93]">🚶 {isFr ? "Pas" : "Steps"}</p>
                            <p className="text-[14px] font-bold text-[#282830]">{new Intl.NumberFormat(isFr ? "fr-FR" : "en-US").format(lastSummary.wearable_highlights.steps.value)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10">
                  <div className="text-3xl mb-3 opacity-30">📞</div>
                  <p className="text-[13px] font-semibold text-[#282830]">{isFr ? "Aucun appel récent" : "No recent calls"}</p>
                  <p className="text-[11px] text-[#8E8E93] mt-1 text-center px-6">
                    {isFr ? "Votre historique d'appels avec Maude apparaîtra ici." : "Your call history with Maude will appear here."}
                  </p>
                </div>
              )}
              <div className="h-6" />
            </div>
          )}
        </div>

        {/* ─── Bottom tab bar ─── */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/98 backdrop-blur-lg border-t border-[#F0F0F2] px-1 pt-1.5 pb-7 z-30">
          <div className="flex items-center justify-around">
            {([
              { id: "today", label: isFr ? "Aujourd'hui" : "Today", Icon: HomeIcon },
              { id: "consult", label: isFr ? "Consulter" : "Consult", Icon: ConsultIcon },
              { id: "insurance", label: isFr ? "Assurance" : "Insurance", Icon: InsuranceIcon },
              { id: "essentials", label: isFr ? "Essentiels" : "Essentials", Icon: EssentialsIcon },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-[2px] min-w-[56px] py-0.5">
                <tab.Icon active={activeTab === tab.id} />
                <span className={`text-[9px] font-medium ${activeTab === tab.id ? "text-[#5C59F3]" : "text-[#8E8E93]"}`}>{tab.label}</span>
              </button>
            ))}
            <button onClick={() => setActiveTab("maude")} className="flex flex-col items-center gap-[2px] min-w-[40px] py-0.5 relative">
              <div className={`w-[24px] h-[24px] rounded-full overflow-hidden transition-all ${activeTab === "maude" ? "ring-2 ring-[#5C59F3] ring-offset-1" : ""}`}>
                <Image src="/maude.png" alt="Maude" width={24} height={24} style={{ width: 24, height: 24 }} className="object-cover" />
              </div>
              {lastSummary && activeTab !== "maude" && (
                <div className="absolute top-0 right-0.5 w-2 h-2 rounded-full bg-[#FF6D39]" />
              )}
            </button>
          </div>
        </div>

        {/* ─── Missed call banner ─── */}
        {notifDismissed && !showNotif && (
          <div className="absolute top-12 inset-x-3 z-40">
            <button onClick={() => { setNotifDismissed(false); setShowNotif(true); }} className="w-full bg-[#F0F3FF] rounded-[16px] p-3 flex items-center gap-2.5 border border-[#D6DBFF] shadow-sm active:scale-[0.98] transition-transform">
              <Image src="/maude.png" alt="Maude" width={30} height={30} style={{ width: 30, height: 30 }} className="rounded-full" />
              <div className="flex-1 text-left">
                <p className="text-[11px] font-semibold text-[#282830]">Maude · {isFr ? "Appel manqué" : "Missed call"}</p>
                <p className="text-[10px] text-[#5C59F3]">{isFr ? "Appuyer pour rappeler" : "Tap to call back"}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2AA79C] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
            </button>
          </div>
        )}

        {/* ─── Incoming call notification ─── */}
        {showNotif && !notifDismissed && (
          <div className="absolute inset-x-3 bottom-20 z-40 animate-[slideUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-white/97 backdrop-blur-xl rounded-[20px] shadow-2xl border border-[#E8E8EA]">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Image src="/maude.png" alt="Maude" width={44} height={44} style={{ width: 44, height: 44 }} className="rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2AA79C] rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-[#282830]">Maude</p>
                    <p className="text-[11px] text-[#8E8E93]">{isFr ? "Suivi santé · Alan" : "Health follow-up · Alan"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#2AA79C] flex items-center justify-center" style={{ animation: "ringPulse 2s ease-in-out infinite" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  </div>
                </div>
                <p className="text-[12px] text-[#3C3C43] mb-3.5 leading-relaxed">
                  {isFr ? `${firstName}, je souhaite prendre de vos nouvelles suite à votre arthroscopie du genou.` : `${firstName}, I'd like to check in on you after your knee arthroscopy.`}
                </p>
                <div className="flex gap-2">
                  <button onClick={onIncomingCall} className="flex-1 py-2.5 bg-[#2AA79C] hover:bg-[#1C6E67] text-white rounded-[12px] font-semibold text-[12px] transition-all active:scale-95 flex items-center justify-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    {isFr ? "Accepter" : "Accept"}
                  </button>
                  <button onClick={() => { setShowNotif(false); setNotifDismissed(true); }} className="flex-1 py-2.5 bg-[#F0F0FF] text-[#5C59F3] rounded-[12px] font-semibold text-[12px] hover:bg-[#D6DBFF] transition-all active:scale-95">
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
