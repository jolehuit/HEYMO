/**
 * Patient actions page — post-call action items in Alan app style
 * Shows: summary, nearby doctors, live chat, appointments, medications, Alan CTAs
 *
 * Owner: Dev 3
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { CallSummary } from "@/lib/types";
import { PatientProfile } from "@/lib/patients";
import { useTranslation } from "@/lib/i18n";
import PhoneFrame from "./PhoneFrame";
import DoctorChat from "./DoctorChat";

interface PatientActionsProps {
  summary: CallSummary;
  patient: PatientProfile;
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

export default function PatientActions({ summary, patient, onViewDashboard, onBack }: PatientActionsProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const slots = isFr ? MOCK_SLOTS_FR : MOCK_SLOTS_EN;
  const doctors = patient.nearbyDoctors || [];
  const [showDoctorChat, setShowDoctorChat] = useState(false);

  if (showDoctorChat) {
    return <DoctorChat summary={summary} patient={patient} onBack={() => setShowDoctorChat(false)} />;
  }

  const appointmentActions = summary.actions.filter((a) => a.type === "appointment");
  const otherActions = summary.actions.filter((a) => a.type !== "appointment");
  const activeMeds = summary.medications_status.filter((m) => m.status === "in_progress");

  return (
    <PhoneFrame>
      <div className="bg-[#FFFCF5] h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#F0F0F2] px-4 pt-10 pb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/maude.png" alt="Maude" width={26} height={26} style={{ width: 26, height: 26 }} className="rounded-full" />
            <div>
              <p className="text-[14px] font-bold text-[#282830]">{isFr ? "Suite de votre appel" : "After your call"}</p>
              <p className="text-[10px] text-[#8E8E93]">{isFr ? "avec Maude · Alan" : "with Maude · Alan"}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-[12px] text-[#5C59F3] font-semibold">{isFr ? "Accueil" : "Home"}</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* Maude summary */}
          <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3 flex gap-2.5 shadow-sm">
            <Image src="/maude.png" alt="Maude" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#5C59F3] mb-0.5">Maude</p>
              <p className="text-[11px] text-[#3C3C43] leading-relaxed">{summary.summary}</p>
            </div>
          </div>

          {/* ─── Live chat with doctor ─── */}
          <div className="bg-gradient-to-r from-[#5C59F3] to-[#2F33A8] rounded-[16px] p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Image src="/maude.png" alt="Doctor" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white">{isFr ? "Parler à un médecin" : "Talk to a doctor"}</p>
                <p className="text-[10px] text-white/70 leading-snug">
                  {isFr ? "Un médecin a le contexte de votre appel. Disponible maintenant." : "A doctor has your call context. Available now."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDoctorChat(true)}
              className="w-full mt-3 py-2 bg-white rounded-[10px] text-[12px] font-semibold text-[#5C59F3] active:scale-95 transition-transform"
            >
              {isFr ? "💬 Démarrer le chat" : "💬 Start chat"}
            </button>
          </div>

          {/* ─── Nearby doctors (Alan Map) ─── */}
          {doctors.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-[#EBFAF9] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="#2AA79C" strokeWidth="2"/><path d="M12 2C7.6 2 4 5.4 4 9.5 4 16 12 22 12 22s8-6 8-12.5C20 5.4 16.4 2 12 2z" stroke="#2AA79C" strokeWidth="1.5"/></svg>
                  </div>
                  <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Professionnels proches" : "Nearby professionals"}</p>
                </div>
                <span className="text-[10px] text-[#5C59F3] font-semibold">{patient.location}</span>
              </div>

              {/* Map placeholder */}
              <div className="w-full h-[80px] rounded-[12px] bg-[#E8F5E9] mb-2.5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4E8D0] to-[#E8F5E9]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#5C59F3] border-2 border-white shadow flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="absolute bottom-1 left-2 text-[8px] text-[#8E8E93]">🗺️ Alan Map</span>
              </div>

              {/* Doctor cards — horizontal scroll like the app */}
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {doctors.map((doc, i) => (
                  <div key={i} className="bg-white rounded-[12px] border border-[#F0F0F2] p-2.5 min-w-[140px] shrink-0">
                    <p className="text-[11px] font-bold text-[#282830] uppercase">{doc.name}</p>
                    <p className="text-[10px] text-[#8E8E93]">{doc.specialty}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#8E8E93]">
                      <span>📍 {doc.distance}</span>
                      <span>🏥 {doc.sector}</span>
                    </div>
                    {doc.available && (
                      <button className="w-full mt-2 py-1.5 bg-[#F0F0FF] rounded-[8px] text-[10px] font-semibold text-[#5C59F3] active:scale-95 transition-transform">
                        {isFr ? "Prendre RDV" : "Book"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#5C59F3] font-semibold mt-2 text-center">
                {isFr ? "📍 Voir plus sur Alan Map >" : "📍 Show more on Alan Map >"}
              </p>
            </div>
          )}

          {/* ─── Appointment slots ─── */}
          {appointmentActions.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#5C59F3] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Prendre rendez-vous" : "Book appointment"}</p>
              </div>

              {appointmentActions.map((action, i) => (
                <div key={i}>
                  <p className="text-[11px] text-[#3C3C43] mb-2">{action.description}</p>
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
                    <p className="text-[10px] text-[#2AA79C] mt-2 flex items-center gap-1">✅ {isFr ? "SMS rappel envoyé" : "Reminder SMS sent"}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── Other actions ─── */}
          {otherActions.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <p className="text-[13px] font-bold text-[#282830] mb-2">{isFr ? "Actions" : "Actions"}</p>
              {otherActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#F5F5F7] last:border-0">
                  <span className="text-[12px] mt-0.5">
                    {action.type === "followup_call" ? "📞" :
                     action.type === "sms_sent" ? "💬" :
                     action.type === "teleconsultation_requested" ? "🏥" :
                     action.type === "doctor_connect" ? "👨‍⚕️" :
                     action.type === "provider_search" ? "📍" : "🚩"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#282830]">{action.description}</p>
                    {action.scheduled_date && <p className="text-[10px] text-[#8E8E93]">{action.scheduled_date}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Medications ─── */}
          {activeMeds.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <p className="text-[13px] font-bold text-[#282830] mb-2">💊 {isFr ? "Médicaments" : "Medications"}</p>
              {activeMeds.map((med, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F5F5F7] last:border-0">
                  <p className="text-[11px] text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && <span className="text-[10px] text-[#8E8E93]">{med.remaining_days}j</span>}
                </div>
              ))}
            </div>
          )}

          {/* ─── Quick Alan CTAs ─── */}
          <div className="grid grid-cols-3 gap-2">
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#5C59F3] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </div>
              <span className="text-[9px] font-medium text-[#282830] text-center leading-tight">{isFr ? "Télé-consult" : "Teleconsult"}</span>
            </button>
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#EBFAF9] flex items-center justify-center">
                <span className="text-base">🗺️</span>
              </div>
              <span className="text-[9px] font-medium text-[#282830] text-center leading-tight">Alan Map</span>
            </button>
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#FFF3E0] flex items-center justify-center">
                <span className="text-base">💰</span>
              </div>
              <span className="text-[9px] font-medium text-[#282830] text-center leading-tight">{isFr ? "Rembourst." : "Claims"}</span>
            </button>
          </div>

          {/* Dashboard link */}
          <button onClick={onViewDashboard} className="w-full text-center py-2">
            <span className="text-[11px] text-[#8E8E93] underline">{isFr ? "Rapport complet (équipe soins)" : "Full report (care team)"}</span>
          </button>

          <div className="h-2" />
        </div>
      </div>
    </PhoneFrame>
  );
}
