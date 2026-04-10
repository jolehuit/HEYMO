/**
 * Patient selector — landing page (BOILERPLATE)
 *
 * Owner: Dev 3
 * TODO(Dev3): Polish the UI — colors, layout, responsiveness.
 * The structure works. Make it look good.
 */

"use client";

import { PATIENTS, PatientProfile } from "@/lib/patients";

interface PatientSelectorProps {
  onSelect: (patient: PatientProfile) => void;
}

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-purple-400">Alan</span> Care Call
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          AI-powered voice follow-up for health members.
          Select a patient profile to start a care call.
        </p>
      </div>

      {/* TODO(Dev3): Improve card design — add gradient headers, animations, etc. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {PATIENTS.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onSelect(patient)}
            className="rounded-2xl bg-slate-800 border border-slate-700 hover:border-purple-500
                       transition-all duration-300 hover:scale-[1.02] text-left p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{patient.emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{patient.name}</h2>
                <p className="text-slate-400 text-sm">{patient.age} years old — {patient.plan}</p>
              </div>
            </div>
            <p className="text-slate-300 mb-1">{patient.eventDescription}</p>
            <p className="text-sm text-slate-500 mb-4">{patient.eventDate}</p>
            <div className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-center font-semibold transition-colors">
              Start Call
            </div>
          </button>
        ))}
      </div>

      <p className="text-slate-600 text-sm mt-12">
        Mistral + Linkup + Thryve + LiveKit
      </p>
    </div>
  );
}
