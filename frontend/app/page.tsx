/**
 * Main page — Patient selector + Call interface.
 * Single-page app: select patient → start call → see dashboard.
 *
 * Owner: Dev 3
 */

"use client";

import { useState } from "react";
import PatientSelector from "@/components/PatientSelector";
import CallInterface from "@/components/CallInterface";
import { PatientProfile } from "@/lib/patients";

export default function Home() {
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(
    null
  );

  if (selectedPatient) {
    return (
      <CallInterface
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return <PatientSelector onSelect={setSelectedPatient} />;
}
