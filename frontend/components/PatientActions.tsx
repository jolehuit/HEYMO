/**
 * Patient actions page — post-call action items in Alan app style
 * Designed to fit inside the iPhone frame mockup
 *
 * Owner: Dev 3
 */

"use client";

import Image from "next/image";
import { CallSummary } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import PhoneFrame from "./PhoneFrame";

interface PatientActionsProps {
  summary: CallSummary;
  onViewDashboard: () => void;
  onBack: () => void;
}

const MOCK_SLOTS_FR = [
  { day: "Lun 14", time: "09:30", ok: true },
  { day: "Mar 15", time: "14:00", ok: true },
  { day: "Mer 16", time: "10:15", ok: true },
  { day: "Jeu 17", time: "11:00", ok: false },
  { day: "Ven 18", time: "16:30", ok: true },
  { day: "Lun 21", time: "09:00", ok: true },
];

const MOCK_SLOTS_EN = [
  { day: "Mon 14", time: "09:30", ok: true },
  { day: "Tue 15", time: "14:00", ok: true },
  { day: "Wed 16", time: "10:15", ok: true },
  { day: "Thu 17", time: "11:00", ok: false },
  { day: "Fri 18", time: "16:30", ok: true },
  { day: "Mon 21", time: "09:00", ok: true },
];

export default function PatientActions({ summary, onViewDashboard, onBack }: PatientActionsProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const slots = isFr ? MOCK_SLOTS_FR : MOCK_SLOTS_EN;

  const appointmentActions = summary.actions.filter((a) => a.type === "appointment");
  const otherActions = summary.actions.filter((a) => a.type !== "appointment");
  const activeMeds = summary.medications_status.filter((m) => m.status === "in_progress");

  return (
    <PhoneFrame>
      <div className="bg-[#FFFCF5] h-full flex flex-col">
        {/* Header — Alan app style */}
        <div className="bg-white border-b border-[#F0F0F2] px-4 pt-10 pb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/maude.png" alt="Maude" width={26} height={26} style={{ width: 26, height: 26 }} className="rounded-full" />
            <div>
              <p className="text-[14px] font-bold text-[#282830]">{isFr ? "Vos actions" : "Your actions"}</p>
              <p className="text-[10px] text-[#8E8E93]">{isFr ? "Suite à votre appel avec Maude" : "Following your call with Maude"}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-[12px] text-[#5C59F3] font-semibold">{isFr ? "Accueil" : "Home"}</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* Maude summary card */}
          <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 flex gap-3 shadow-sm">
            <Image src="/maude.png" alt="Maude" width={36} height={36} style={{ width: 36, height: 36 }} className="rounded-full shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#5C59F3] mb-0.5">{isFr ? "Résumé de Maude" : "Maude's summary"}</p>
              <p className="text-[11px] text-[#3C3C43] leading-relaxed line-clamp-3">{summary.summary}</p>
            </div>
          </div>

          {/* Appointment booking */}
          {appointmentActions.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-[8px] bg-[#5C59F3] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Prendre rendez-vous" : "Book appointment"}</p>
              </div>

              {appointmentActions.map((action, i) => (
                <div key={i}>
                  <p className="text-[11px] text-[#3C3C43] mb-2.5">{action.description}</p>

                  <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1.5">
                    {isFr ? "Créneaux disponibles" : "Available slots"}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {slots.map((slot, j) => (
                      <button key={j} disabled={!slot.ok}
                        className={`rounded-[10px] py-2 text-center transition-all active:scale-95 ${
                          slot.ok ? "bg-[#F0F0FF] text-[#5C59F3]" : "bg-[#F5F5F7] text-[#C7C7CC] line-through"
                        }`}>
                        <p className="text-[10px] font-semibold">{slot.day}</p>
                        <p className="text-[12px] font-bold">{slot.time}</p>
                      </button>
                    ))}
                  </div>

                  {action.sms_sent && (
                    <p className="text-[10px] text-[#2AA79C] mt-2 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2AA79C" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="#2AA79C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {isFr ? "SMS de rappel envoyé" : "Reminder SMS sent"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Other actions */}
          {otherActions.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#F0F3FF] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#5C59F3" strokeWidth="2"/><path d="M8 12l3 3 5-5" stroke="#5C59F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Autres actions" : "Other actions"}</p>
              </div>
              {otherActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[#F5F5F7] last:border-0">
                  <div className="w-5 h-5 rounded-full bg-[#F0F0FF] flex items-center justify-center shrink-0 mt-0.5">
                    {action.type === "followup_call" ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#5C59F3"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#FF6D39" strokeWidth="2"/><line x1="4" y1="22" x2="4" y2="15" stroke="#FF6D39" strokeWidth="2"/></svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#282830]">{action.description}</p>
                    {action.scheduled_date && (
                      <p className="text-[10px] text-[#8E8E93] mt-0.5">{isFr ? "Prévu" : "Scheduled"} : {action.scheduled_date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medications */}
          {activeMeds.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#EBFAF9] flex items-center justify-center">
                  <span className="text-sm">💊</span>
                </div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Médicaments en cours" : "Current medications"}</p>
              </div>
              {activeMeds.map((med, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#F5F5F7] last:border-0">
                  <p className="text-[11px] text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && (
                    <span className="text-[10px] text-[#8E8E93] shrink-0 ml-2">{med.remaining_days}j</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Alan CTAs — app style */}
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-white rounded-[16px] border border-[#F0F0F2] p-3 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-[12px] bg-[#5C59F3] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <p className="text-[11px] font-semibold text-[#282830]">{isFr ? "Téléconsultation" : "Teleconsult"}</p>
              <p className="text-[9px] text-[#8E8E93] leading-snug text-center">{isFr ? "Parlez à un médecin" : "Talk to a doctor"}</p>
            </button>
            <button className="bg-white rounded-[16px] border border-[#F0F0F2] p-3 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-[12px] bg-[#EBFAF9] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="#2AA79C" strokeWidth="2"/><path d="M12 2C7.6 2 4 5.4 4 9.5 4 16 12 22 12 22s8-6 8-12.5C20 5.4 16.4 2 12 2z" stroke="#2AA79C" strokeWidth="1.5"/></svg>
              </div>
              <p className="text-[11px] font-semibold text-[#282830]">Alan Map</p>
              <p className="text-[9px] text-[#8E8E93] leading-snug text-center">{isFr ? "Trouver un pro" : "Find a pro"}</p>
            </button>
          </div>

          {/* Dashboard link */}
          <button onClick={onViewDashboard} className="w-full text-center py-2">
            <span className="text-[11px] text-[#8E8E93] underline">
              {isFr ? "Voir le rapport complet (équipe soins)" : "View full report (care team)"}
            </span>
          </button>

          <div className="h-2" />
        </div>
      </div>
    </PhoneFrame>
  );
}
