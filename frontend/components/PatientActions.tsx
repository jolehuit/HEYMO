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
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedItem(expandedItem === id ? null : id);

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

  const hasProviders = providerCtas.length > 0;
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

          {/* ─── 2. ACTIONS PROGRAMMÉES (only appointments + followup calls) ─── */}
          {(() => {
            const scheduledActions = summary.actions.filter((a) =>
              a.type === "appointment" || a.type === "followup_call"
            );
            if (scheduledActions.length === 0) return null;
            return (
              <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5C59F3] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Actions programmées" : "Scheduled actions"}</p>
                </div>

                {scheduledActions.map((action, i) => {
                  const id = `action-${i}`;
                  const isOpen = expandedItem === id;
                  return (
                    <button key={i} onClick={() => toggle(id)} className="w-full text-left py-2 border-b border-[#F5F5F7] last:border-0">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[14px] mt-0.5">{action.type === "appointment" ? "📅" : "📞"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-[#282830]">{action.description}</p>
                          {action.scheduled_date && <p className="text-[10px] text-[#5C59F3] mt-0.5">📅 {action.scheduled_date}</p>}
                        </div>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5C59F3" strokeWidth="2.5" strokeLinecap="round" className={`mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                      {isOpen && action.type === "appointment" && (
                        <div className="ml-7 mt-2 bg-[#F5F8FE] rounded-[10px] p-2.5">
                          {action.sms_sent && <p className="text-[10px] text-[#2AA79C] mb-2">✅ SMS {isFr ? "de rappel envoyé" : "reminder sent"}</p>}
                          <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1.5">{isFr ? "Créneaux disponibles" : "Available slots"}</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(isFr
                              ? [{ d: "Lun 14", t: "09:30", ok: true }, { d: "Mar 15", t: "14:00", ok: true }, { d: "Mer 16", t: "10:15", ok: true }, { d: "Jeu 17", t: "11:00", ok: false }, { d: "Ven 18", t: "16:30", ok: true }, { d: "Lun 21", t: "09:00", ok: true }]
                              : [{ d: "Mon 14", t: "09:30", ok: true }, { d: "Tue 15", t: "14:00", ok: true }, { d: "Wed 16", t: "10:15", ok: true }, { d: "Thu 17", t: "11:00", ok: false }, { d: "Fri 18", t: "16:30", ok: true }, { d: "Mon 21", t: "09:00", ok: true }]
                            ).map((slot, j) => (
                              <div key={j} className={`rounded-[8px] py-1.5 text-center ${slot.ok ? "bg-white text-[#5C59F3] border border-[#D6DBFF]" : "bg-[#F0F0F2] text-[#C7C7CC] line-through"}`}>
                                <p className="text-[9px] font-semibold">{slot.d}</p>
                                <p className="text-[11px] font-bold">{slot.t}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {isOpen && action.type === "followup_call" && (
                        <div className="ml-7 mt-2 bg-[#F5F8FE] rounded-[10px] p-2.5">
                          {action.sms_sent && <p className="text-[10px] text-[#2AA79C]">✅ SMS {isFr ? "de rappel envoyé" : "reminder sent"}</p>}
                          <p className="text-[10px] text-[#5C59F3] font-semibold">{isFr ? "📞 Rappel programmé" : "📞 Callback scheduled"}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

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

          {/* ─── 4. PROFESSIONNELS RECOMMANDÉS ─── */}
          {hasProviders && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#EBFAF9] flex items-center justify-center">📍</div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Professionnels recommandés" : "Recommended professionals"}</p>
              </div>

              <div className="space-y-2">
                {providerCtas.map((cta, i) => {
                  const d = cta.data || {};
                  const desc = d.description ? String(d.description) : "";
                  const specialty = d.specialty ? String(d.specialty) : "";
                  const fullResult = d.full_result ? String(d.full_result) : "";
                  const id = `provider-${i}`;
                  const isOpen = expandedItem === id;
                  return (
                    <button key={`prov-${i}`} onClick={() => toggle(id)} className="w-full text-left">
                      <div className="bg-white border border-[#F0F0F2] rounded-[14px] overflow-hidden shadow-sm">
                        {/* Mini map */}
                        <div className="h-[50px] bg-gradient-to-b from-[#D4E8D0] to-[#E8F5E9] relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#5C59F3] border-2 border-white shadow flex items-center justify-center">
                            <span className="text-white text-[8px]">📍</span>
                          </div>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-[12px] font-bold text-[#282830]">{cta.label}</p>
                          {desc && desc !== "..." && <p className="text-[10px] text-[#8E8E93] mt-0.5">{desc}</p>}
                          {specialty && <span className="inline-block mt-1 text-[9px] bg-[#F0F0FF] text-[#5C59F3] px-2 py-0.5 rounded-full font-medium">{specialty}</span>}
                        </div>
                        {isOpen && fullResult && (
                          <div className="px-3 pb-2.5 border-t border-[#F5F5F7]">
                            <p className="text-[10px] text-[#3C3C43] leading-relaxed pt-2">{fullResult}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── 5. REMBOURSEMENT (only if discussed during the call) ─── */}
          {reimbursementCtas.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#FFF3E0] flex items-center justify-center">💰</div>
                <p className="text-[13px] font-bold text-[#282830]">{isFr ? "Remboursement" : "Reimbursement"}</p>
              </div>

              {reimbursementCtas.map((cta, i) => {
                const d = cta.data || {};
                const secu = d.secu_reimbursement ? Number(d.secu_reimbursement) : null;
                const alan = d.alan_reimbursement ? Number(d.alan_reimbursement) : null;
                const oop = d.out_of_pocket !== undefined ? Number(d.out_of_pocket) : null;
                const price = d.average_price ? Number(d.average_price) : null;
                const desc = d.description ? String(d.description) : null;
                return (
                  <div key={i} className="space-y-1 mb-2">
                    {price !== null && <div className="flex justify-between"><span className="text-[10px] text-[#8E8E93]">{isFr ? "Prix moyen" : "Avg. price"}</span><span className="text-[10px] font-semibold">{price}€</span></div>}
                    {secu !== null && <div className="flex justify-between"><span className="text-[10px] text-[#8E8E93]">{isFr ? "Sécu" : "Social security"}</span><span className="text-[10px] font-semibold">{secu}€</span></div>}
                    {alan !== null && <div className="flex justify-between"><span className="text-[10px] text-[#8E8E93]">Alan</span><span className="text-[10px] font-semibold text-[#5C59F3]">{alan}€</span></div>}
                    {oop !== null && <div className="flex justify-between border-t border-[#F5F5F7] pt-1"><span className="text-[10px] font-semibold">{isFr ? "Reste à charge" : "Out of pocket"}</span><span className="text-[11px] font-bold text-[#2AA79C]">{oop}€</span></div>}
                    {d.direct_billing ? <p className="text-[10px] text-[#2AA79C] mt-1">✅ {isFr ? "Tiers payant" : "Direct billing"}</p> : null}
                    {!price && !secu && !alan && oop === null && desc && <p className="text-[10px] text-[#3C3C43]">{desc}</p>}
                  </div>
                );
              })}

            </div>
          )}

          {/* ─── 6. MÉDICAMENTS ─── */}
          {activeMeds.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#F0F0F2] p-3.5 shadow-sm">
              <p className="text-[13px] font-bold text-[#282830] mb-2">💊 {isFr ? "Médicaments en cours" : "Current medications"}</p>
              {activeMeds.map((med, i) => {
                const id = `med-${i}`;
                const isOpen = expandedItem === id;
                const patientMed = patient.medications?.find((m) => m.name === med.name);
                return (
                  <button key={i} onClick={() => toggle(id)} className="w-full text-left py-1.5 border-b border-[#F5F5F7] last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#282830]">{med.name}</p>
                      <div className="flex items-center gap-1.5">
                        {med.remaining_days !== undefined && <span className="text-[10px] text-[#8E8E93]">{med.remaining_days}j</span>}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9DA3BA" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-1.5 bg-[#F5F8FE] rounded-[8px] p-2 space-y-0.5">
                        {patientMed && <p className="text-[10px] text-[#3C3C43]">{patientMed.dosage}</p>}
                        {patientMed && <p className="text-[10px] text-[#8E8E93]">{patientMed.frequency}</p>}
                        {med.compliance && <p className="text-[10px] text-[#2AA79C]">{isFr ? "Observance" : "Compliance"}: {med.compliance}</p>}
                      </div>
                    )}
                  </button>
                );
              })}
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
