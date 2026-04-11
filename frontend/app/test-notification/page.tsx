/**
 * Test route — preview post-call flow (notification → actions → dashboard)
 * Access at /test-notification
 */

"use client";

import { useState } from "react";
import { CallSummary } from "@/lib/types";
import { I18nProvider } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import PhoneNotification from "@/components/PhoneNotification";
import PatientActions from "@/components/PatientActions";
import Dashboard from "@/components/Dashboard";

const MOCK_SUMMARY: CallSummary = {
  patient_id: "sophie_martin",
  patient_name: "Sophie Martin",
  date: "April 11, 2026",
  duration_seconds: 247,
  alert_level: "orange",
  summary:
    "Patient reports moderate knee pain (4/10) and some difficulty sleeping. Post-surgery recovery is progressing but slower than expected. Surgeon follow-up appointment not yet booked.",
  patient_state: {
    pain_level: "4/10 — moderate",
    mood: "Slightly anxious about recovery timeline",
    general: "Recovering, some fatigue",
  },
  medications_status: [
    { name: "Ketoprofen 100mg", status: "completed", compliance: "100%", remaining_days: 0 },
    { name: "Lovenox 40mg (injection)", status: "in_progress", compliance: "95%", remaining_days: 7 },
    { name: "Paracetamol 1g", status: "in_progress", compliance: "as needed", remaining_days: 14 },
  ],
  wearable_highlights: {
    resting_hr: { value: 78, baseline: 65, trend: "up" },
    sleep_hours: { value: 5.8, baseline: 7.2, trend: "down" },
    steps: { value: 2100, baseline: 8500, trend: "down" },
    risk_patterns: ["Elevated resting HR post-surgery", "Sleep deficit — 3 consecutive nights below 6h"],
  },
  actions: [
    { type: "appointment", description: "Book surgeon follow-up within 10 days", status: "pending", sms_sent: true, scheduled_date: "Before April 21, 2026" },
    { type: "followup_call", description: "Check on sleep quality and pain evolution", status: "scheduled", sms_sent: false, scheduled_date: "April 16, 2026" },
    { type: "flag", description: "Elevated heart rate — monitor over next 48h", status: "active" },
  ],
  reimbursement_discussed: {
    procedure: "Right knee arthroscopy",
    average_price: 1850.0,
    secu_rate: 0.7,
    secu_reimbursement: 1295.0,
    alan_reimbursement: 480.0,
    out_of_pocket: 75.0,
    direct_billing: true,
  },
  escalated: false,
};

export default function TestNotification() {
  const [step, setStep] = useState<"notification" | "actions" | "dashboard">("notification");

  return (
    <I18nProvider>
      <div className="relative">
        {step !== "notification" && (
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector />
          </div>
        )}

        {step === "notification" && (
          <PhoneNotification patientName="Sophie" onOpen={() => setStep("actions")} />
        )}
        {step === "actions" && (
          <PatientActions
            summary={MOCK_SUMMARY}
            onViewDashboard={() => setStep("dashboard")}
            onBack={() => setStep("notification")}
          />
        )}
        {step === "dashboard" && (
          <Dashboard
            summary={MOCK_SUMMARY}
            onBack={() => setStep("notification")}
          />
        )}
      </div>
    </I18nProvider>
  );
}
