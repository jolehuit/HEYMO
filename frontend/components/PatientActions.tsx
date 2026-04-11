/**
 * Patient actions page — post-call action items and Alan CTAs
 *
 * Owner: Dev 3
 */

"use client";

import Image from "next/image";
import { CallSummary } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { CalendarIcon, PhoneIcon, CheckCircleIcon, PillIcon } from "./AlanIcons";

interface PatientActionsProps {
  summary: CallSummary;
  onViewDashboard: () => void;
  onBack: () => void;
}

const MOCK_SLOTS = [
  { day: "Lun 14/04", time: "09:30", available: true },
  { day: "Mar 15/04", time: "14:00", available: true },
  { day: "Mer 16/04", time: "10:15", available: true },
  { day: "Jeu 17/04", time: "11:00", available: false },
  { day: "Ven 18/04", time: "16:30", available: true },
];

const MOCK_SLOTS_EN = [
  { day: "Mon 04/14", time: "09:30", available: true },
  { day: "Tue 04/15", time: "14:00", available: true },
  { day: "Wed 04/16", time: "10:15", available: true },
  { day: "Thu 04/17", time: "11:00", available: false },
  { day: "Fri 04/18", time: "16:30", available: true },
];

export default function PatientActions({ summary, onViewDashboard, onBack }: PatientActionsProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const slots = isFr ? MOCK_SLOTS : MOCK_SLOTS_EN;

  const appointmentActions = summary.actions.filter((a) => a.type === "appointment");
  const otherActions = summary.actions.filter((a) => a.type !== "appointment");

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      {/* Header */}
      <div className="bg-white border-b border-[#ECF1FC] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/maude.png" alt="Maude" width={32} height={32} className="rounded-full" />
            <div>
              <h1 className="text-lg font-bold text-[#282830]">
                {isFr ? "Vos actions" : "Your actions"}
              </h1>
              <p className="text-xs text-[#9DA3BA]">
                {isFr ? `Suite à votre appel du ${summary.date}` : `Following your call on ${summary.date}`}
              </p>
            </div>
          </div>
          <button onClick={onBack} className="text-sm text-[#5C59F3] font-medium hover:underline">
            {isFr ? "Nouvel appel" : "New call"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Summary banner */}
        <div className="alan-card p-5 flex items-start gap-4">
          <Image src="/maude.png" alt="Maude" width={44} height={44} className="rounded-full shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#282830] mb-1">
              {isFr ? "Résumé de Maude" : "Maude's summary"}
            </p>
            <p className="text-sm text-[#464754]">{summary.summary}</p>
          </div>
        </div>

        {/* Appointment booking */}
        {appointmentActions.length > 0 && (
          <div className="alan-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                <CalendarIcon size={18} color="#5C59F3" />
              </div>
              <h2 className="text-lg font-bold text-[#282830]">
                {isFr ? "Prendre rendez-vous" : "Book appointment"}
              </h2>
            </div>

            {appointmentActions.map((action, i) => (
              <div key={i} className="mb-4">
                <p className="text-sm text-[#464754] mb-3">{action.description}</p>

                {/* Available slots */}
                <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-2">
                  {isFr ? "Créneaux disponibles" : "Available slots"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot, j) => (
                    <button
                      key={j}
                      disabled={!slot.available}
                      className={`rounded-xl px-3 py-2.5 text-center transition-all ${
                        slot.available
                          ? "bg-[#F0F3FF] hover:bg-[#D6DBFF] text-[#5C59F3] font-medium cursor-pointer"
                          : "bg-[#F5F8FE] text-[#9DA3BA] cursor-not-allowed line-through"
                      }`}
                    >
                      <p className="text-xs font-semibold">{slot.day}</p>
                      <p className="text-sm">{slot.time}</p>
                    </button>
                  ))}
                </div>

                {action.sms_sent && (
                  <p className="text-xs text-[#2AA79C] mt-2 flex items-center gap-1">
                    <CheckCircleIcon size={12} color="#2AA79C" />
                    {isFr ? "SMS de rappel envoyé" : "Reminder SMS sent"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other actions */}
        {otherActions.length > 0 && (
          <div className="alan-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                <CheckCircleIcon size={18} color="#5C59F3" />
              </div>
              <h2 className="text-lg font-bold text-[#282830]">
                {isFr ? "Autres actions" : "Other actions"}
              </h2>
            </div>
            {otherActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#ECF1FC] last:border-0">
                <div className="w-6 h-6 rounded-full bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5">
                  {action.type === "followup_call" ? <PhoneIcon size={12} color="#5C59F3" /> : <CheckCircleIcon size={12} color="#5C59F3" />}
                </div>
                <div>
                  <p className="text-sm text-[#282830]">{action.description}</p>
                  {action.scheduled_date && (
                    <p className="text-xs text-[#9DA3BA] mt-0.5">
                      {isFr ? "Prévu le" : "Scheduled"} : {action.scheduled_date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Medications reminder */}
        {summary.medications_status.some((m) => m.status === "in_progress") && (
          <div className="alan-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                <PillIcon size={18} color="#5C59F3" />
              </div>
              <h2 className="text-lg font-bold text-[#282830]">
                {isFr ? "Vos médicaments en cours" : "Current medications"}
              </h2>
            </div>
            {summary.medications_status
              .filter((m) => m.status === "in_progress")
              .map((med, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#ECF1FC] last:border-0">
                  <p className="text-sm text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && (
                    <span className="text-xs text-[#9DA3BA]">
                      {med.remaining_days}j {isFr ? "restants" : "remaining"}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Alan CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="alan-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform text-left">
            <div className="w-10 h-10 rounded-xl bg-[#5C59F3] flex items-center justify-center shrink-0">
              <PhoneIcon size={20} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#282830]">
                {isFr ? "Téléconsultation" : "Teleconsultation"}
              </p>
              <p className="text-xs text-[#9DA3BA]">
                {isFr ? "Parlez à un médecin maintenant" : "Talk to a doctor now"}
              </p>
            </div>
          </button>

          <button className="alan-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform text-left">
            <div className="w-10 h-10 rounded-xl bg-[#5C59F3] flex items-center justify-center shrink-0">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#282830]">
                {isFr ? "Mon espace Alan" : "My Alan space"}
              </p>
              <p className="text-xs text-[#9DA3BA]">
                {isFr ? "Remboursements, carte, contrat" : "Reimbursements, card, contract"}
              </p>
            </div>
          </button>
        </div>

        {/* Link to admin dashboard */}
        <div className="text-center pt-2">
          <button
            onClick={onViewDashboard}
            className="text-sm text-[#9DA3BA] hover:text-[#5C59F3] transition-colors underline"
          >
            {isFr ? "Voir le rapport complet (vue équipe soins)" : "View full report (care team view)"}
          </button>
        </div>
      </div>
    </div>
  );
}
