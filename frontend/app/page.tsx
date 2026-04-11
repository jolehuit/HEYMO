/**
 * Main page — Alan app flow
 * Sophie Martin is the default patient (no selection screen)
 * Flow: Alan Home → Incoming call → Call → Notification → Actions → Dashboard
 *
 * Owner: Dev 3
 */

"use client";

import { useState } from "react";
import AlanHomeScreen from "@/components/AlanHomeScreen";
import CallInterface from "@/components/CallInterface";
import { PATIENTS } from "@/lib/patients";
import { I18nProvider } from "@/lib/i18n";

const SOPHIE = PATIENTS[0]; // Sophie Martin — default patient

export default function Home() {
  const [step, setStep] = useState<"home" | "call">("home");

  return (
    <I18nProvider>
      {step === "home" ? (
        <AlanHomeScreen
          patient={SOPHIE}
          onIncomingCall={() => setStep("call")}
        />
      ) : (
        <CallInterface
          patient={SOPHIE}
          onBack={() => setStep("home")}
        />
      )}
    </I18nProvider>
  );
}
