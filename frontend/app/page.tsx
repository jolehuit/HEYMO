/**
 * Main page — Alan app flow
 * Sophie Martin is the default patient (no selection screen)
 * Flow: Alan Home → Incoming call → Call → Notification → Actions → Dashboard
 * Maude profile tab → last call history
 *
 * Owner: Dev 3
 */

"use client";

import { useState } from "react";
import AlanHomeScreen from "@/components/AlanHomeScreen";
import CallInterface from "@/components/CallInterface";
import { PATIENTS } from "@/lib/patients";
import { CallSummary } from "@/lib/types";
import { I18nProvider } from "@/lib/i18n";

const SOPHIE = PATIENTS[0];

export default function Home() {
  const [step, setStep] = useState<"home" | "call">("home");
  const [lastSummary, setLastSummary] = useState<CallSummary | null>(null);

  return (
    <I18nProvider>
      {step === "home" ? (
        <AlanHomeScreen
          patient={SOPHIE}
          onIncomingCall={() => setStep("call")}
          lastSummary={lastSummary}
        />
      ) : (
        <CallInterface
          patient={SOPHIE}
          onBack={() => setStep("home")}
          onSummaryGenerated={setLastSummary}
        />
      )}
    </I18nProvider>
  );
}
