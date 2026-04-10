/**
 * Patient profile selector — the landing page component.
 * The judge picks one of 3 patient profiles, then clicks "Start call".
 *
 * Owner: Dev 3
 */

"use client";

import { PATIENTS, PatientProfile } from "@/lib/patients";

interface PatientSelectorProps {
  onSelect: (patient: PatientProfile) => void;
}

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-purple-400">Alan</span> Care Call
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          AI-powered voice follow-up for health members. Select a patient
          profile to start a care call.
        </p>
      </div>

      {/* Patient cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {PATIENTS.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onSelect(patient)}
            className="group relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700
                       hover:border-purple-500 transition-all duration-300 hover:scale-[1.02]
                       hover:shadow-lg hover:shadow-purple-500/20 text-left"
          >
            {/* Gradient header */}
            <div
              className={`bg-gradient-to-r ${patient.color} p-6 flex items-center justify-between`}
            >
              <span className="text-4xl">{patient.emoji}</span>
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                {patient.plan}
              </span>
            </div>

            {/* Card body */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">{patient.name}</h2>
              <p className="text-slate-400 text-sm mb-4">
                {patient.age} years old
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Event
                  </span>
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                    {patient.eventType}
                  </span>
                </div>
                <p className="text-slate-300">{patient.eventDescription}</p>
                <p className="text-sm text-slate-500">{patient.eventDate}</p>
              </div>

              <div
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-center
                            font-semibold transition-colors group-hover:bg-purple-500"
              >
                Start Call
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="text-slate-600 text-sm mt-12">
        Built with Mistral (Voxtral STT + Small 4 LLM + Voxtral TTS) | Linkup
        | Thryve | LiveKit
      </p>
    </div>
  );
}
