/**
 * Patient actions — post-call recap personalized from live CTAs
 * Organized: actions from the call first, then to-do, then services
 *
 * Owner: Dev 3
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { CallSummary, LiveCTA } from "@/lib/types";
import { PatientProfile } from "@/lib/patients";
import { useTranslation } from "@/lib/i18n";
import PhoneFrame from "./PhoneFrame";
import DoctorChat from "./DoctorChat";

interface PatientActionsProps {
  summary: CallSummary;
  patient: PatientProfile;
  liveCtas?: LiveCTA[];
  onViewDashboard: () => void;
  onBack: () => void;
}

export default function PatientActions({ summary, patient, liveCtas = [], onViewDashboard, onBack }: PatientActionsProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [showDoctorChat, setShowDoctorChat] = useState(false);

  if (showDoctorChat) {
    return <DoctorChat summary={summary} patient={patient} onBack={() => setShowDoctorChat(false)} />;
  }

  // Separate CTAs by type
  const providerCtas = liveCtas.filter((c) => c.action === "provider");
  const reimbursementCtas = liveCtas.filter((c) => c.action === "reimbursement");
  const appointmentCtas = liveCtas.filter((c) => c.action === "appointment");
  const teleconsultCtas = liveCtas.filter((c) => c.action === "teleconsultation");
  const doctorConnectCtas = liveCtas.filter((c) => c.action === "doctor_connect");
  const activeMeds = summary.medications_status.filter((m) => m.status === "in_progress");

  const hasProviders = providerCtas.length > 0 || (patient.nearbyDoctors && patient.nearbyDoctors.length > 0);
  const hasDoctorConnect = doctorConnectCtas.length > 0;

  return (
    <PhoneFrame>
      <div className="bg-[#FFFCF5] h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#F0F0F2] px-4 pt-10 pb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/maude.png" alt="Maude" width={26} height={26} style={{ width: 26, height: 26 }} className="rounded-full" />
            <div>
              <p className="text-[14px] font-bold text-[#282830]">{isFr ? "Récapitulatif" : "Recap"}</p>
              <p className="text-[10px] text-[#8E8E93]">{isFr ? "Appel avec Maude · Alan" : "Call with Maude · Alan"}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-[12px] text-[#5C59F3] font-semibold">{isFr ? "Accueil" : "Home"}</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* ─── 1. RÉSUMÉ DE MAUDE ─── */}
          <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3 flex gap-2.5 shadow-sm">
            <Image src="/maude.png" alt="Maude" width={32} height={32} style={{ width: 32, height: 32 }} className="rounded-full shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#5C59F3] mb-0.5">Maude</p>
              <p className="text-[11px] text-[#3C3C43] leading-relaxed">{summary.summary}</p>
            </div>
          </div>

          {/* ─── 2. ACTIONS PROGRAMMÉES (from CTAs during the call) ─── */}
          {(appointmentCtas.length > 0 || summary.actions.length > 0) && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#5C59F3] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Actions programmées" : "Scheduled actions"}</p>
              </div>

              {/* Show each action with its real data */}
              {summary.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[#F5F5F7] last:border-0">
                  <span className="text-[14px] mt-0.5">
                    {action.type === "appointment" ? "📅" :
                     action.type === "followup_call" ? "📞" :
                     action.type === "sms_sent" ? "💬" :
                     action.type === "teleconsultation_requested" ? "🏥" :
                     action.type === "doctor_connect" ? "👨‍⚕️" :
                     action.type === "provider_search" ? "📍" : "🚩"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#282830]">{action.description}</p>
                    {action.scheduled_date && <p className="text-[10px] text-[#5C59F3] mt-0.5">📅 {action.scheduled_date}</p>}
                    {action.sms_sent && <p className="text-[10px] text-[#2AA79C] mt-0.5">✅ SMS {isFr ? "envoyé" : "sent"}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── 3. CHAT MÉDECIN (if doctor_connect CTA was sent) ─── */}
          {(hasDoctorConnect || teleconsultCtas.length > 0) && (
            <div className="bg-gradient-to-r from-[#5C59F3] to-[#2F33A8] rounded-[16px] p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">👨‍⚕️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white">{isFr ? "Parler à un médecin" : "Talk to a doctor"}</p>
                  <p className="text-[10px] text-white/70 leading-snug">
                    {doctorConnectCtas[0]?.data?.reason
                      ? String(doctorConnectCtas[0].data.reason)
                      : (isFr ? "Contexte de l'appel partagé" : "Call context shared")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDoctorChat(true)} className="w-full mt-3 py-2 bg-white rounded-[10px] text-[12px] font-semibold text-[#5C59F3] active:scale-95 transition-transform">
                {isFr ? "💬 Démarrer le chat" : "💬 Start chat"}
              </button>
            </div>
          )}

          {/* ─── 4. PROFESSIONNELS PROCHES (from provider CTAs + patient data) ─── */}
          {hasProviders && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-[#EBFAF9] flex items-center justify-center">📍</div>
                  <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Professionnels recommandés" : "Recommended professionals"}</p>
                </div>
                {patient.location && <span className="text-[10px] text-[#5C59F3] font-semibold">{patient.location}</span>}
              </div>

              {/* Real provider results from Linkup during the call */}
              {providerCtas.map((cta, i) => {
                const d = cta.data || {};
                const result = d.result ? String(d.result) : "";
                const specialty = d.specialty ? String(d.specialty) : "";
                const location = d.location ? String(d.location) : "";
                return (
                  <div key={`linkup-${i}`} className="bg-[#F0F0FF] rounded-[12px] p-2.5 mb-2">
                    <p className="text-[11px] font-bold text-[#5C59F3]">{cta.label}</p>
                    {result && <p className="text-[10px] text-[#3C3C43] leading-relaxed mt-1">{result.slice(0, 250)}{result.length > 250 ? "..." : ""}</p>}
                    {!result && specialty && <p className="text-[10px] text-[#8E8E93] mt-0.5">{specialty} — {location}</p>}
                  </div>
                );
              })}

              {/* Static nearby doctors from patient data */}
              {patient.nearbyDoctors && patient.nearbyDoctors.length > 0 && (
                <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 mt-1">
                  {patient.nearbyDoctors.map((doc, i) => (
                    <div key={i} className="bg-white rounded-[12px] border border-[#F0F0F2] p-2.5 min-w-[140px] shrink-0">
                      <p className="text-[11px] font-bold text-[#282830]">{doc.name}</p>
                      <p className="text-[10px] text-[#8E8E93]">{doc.specialty}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-[#8E8E93]">
                        <span>📍 {doc.distance}</span>
                        <span>{doc.sector}</span>
                      </div>
                      {doc.available && (
                        <button className="w-full mt-2 py-1.5 bg-[#F0F0FF] rounded-[8px] text-[10px] font-semibold text-[#5C59F3] active:scale-95 transition-transform">
                          {isFr ? "Prendre RDV" : "Book"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── 5. REMBOURSEMENT (from reimbursement CTAs) ─── */}
          {(reimbursementCtas.length > 0 || summary.reimbursement_discussed) && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#FFF3E0] flex items-center justify-center">💰</div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Remboursement" : "Reimbursement"}</p>
              </div>

              {reimbursementCtas.map((cta, i) => {
                const data = cta.data || {};
                return (
                  <div key={i} className="space-y-1 mb-2">
                    <p className="text-[11px] font-semibold text-[#282830]">{cta.label}</p>
                    {Object.entries(data).filter(([k]) => k !== "patient_id").map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[10px] text-[#8E8E93] capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-[10px] font-semibold text-[#282830]">{typeof val === "number" ? `${val}€` : String(val)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {summary.reimbursement_discussed && reimbursementCtas.length === 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-[#282830]">{summary.reimbursement_discussed.procedure}</p>
                  <div className="flex justify-between"><span className="text-[10px] text-[#8E8E93]">{isFr ? "Sécu" : "Social security"}</span><span className="text-[10px] font-semibold">{summary.reimbursement_discussed.secu_reimbursement}€</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-[#8E8E93]">Alan</span><span className="text-[10px] font-semibold text-[#5C59F3]">{summary.reimbursement_discussed.alan_reimbursement}€</span></div>
                  <div className="flex justify-between border-t border-[#F5F5F7] pt-1"><span className="text-[10px] font-semibold">{isFr ? "Reste à charge" : "Out of pocket"}</span><span className="text-[11px] font-bold">{summary.reimbursement_discussed.out_of_pocket}€</span></div>
                  {summary.reimbursement_discussed.direct_billing && <p className="text-[10px] text-[#2AA79C] mt-1">✅ {isFr ? "Tiers payant" : "Direct billing"}</p>}
                </div>
              )}
            </div>
          )}

          {/* ─── 6. MÉDICAMENTS ─── */}
          {activeMeds.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <p className="text-[13px] font-bold text-[#282830] mb-2">💊 {isFr ? "Médicaments en cours" : "Current medications"}</p>
              {activeMeds.map((med, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F5F5F7] last:border-0">
                  <p className="text-[11px] text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && <span className="text-[10px] text-[#8E8E93]">{med.remaining_days}j</span>}
                </div>
              ))}
            </div>
          )}

          {/* ─── 7. SERVICES ALAN ─── */}
          <div className="grid grid-cols-3 gap-2">
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#5C59F3] flex items-center justify-center text-sm">📞</div>
              <span className="text-[9px] font-medium text-[#282830] text-center">{isFr ? "Téléconsult" : "Teleconsult"}</span>
            </button>
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#EBFAF9] flex items-center justify-center text-sm">🗺️</div>
              <span className="text-[9px] font-medium text-[#282830] text-center">Alan Map</span>
            </button>
            <button className="bg-white rounded-[14px] border border-[#F0F0F2] p-2.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-[#FFF3E0] flex items-center justify-center text-sm">💰</div>
              <span className="text-[9px] font-medium text-[#282830] text-center">{isFr ? "Rembourst." : "Claims"}</span>
            </button>
          </div>

          {/* Dashboard */}
          <button onClick={onViewDashboard} className="w-full text-center py-2">
            <span className="text-[11px] text-[#8E8E93] underline">{isFr ? "Rapport complet (équipe soins)" : "Full report (care team)"}</span>
          </button>
          <div className="h-2" />
        </div>
      </div>
    </PhoneFrame>
  );
}
