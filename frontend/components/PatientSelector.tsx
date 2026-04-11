/**
 * Patient selector — landing page
 *
 * Owner: Dev 3
 */

"use client";

import Image from "next/image";
import { PATIENTS, PatientProfile } from "@/lib/patients";
import { PhoneIcon } from "./AlanIcons";

interface PatientSelectorProps {
  onSelect: (patient: PatientProfile) => void;
}

const planColors: Record<string, { bg: string; text: string; badge: string }> = {
  blue: {
    bg: "bg-[#F0F3FF]",
    text: "text-[#5C59F3]",
    badge: "bg-[#5C59F3]",
  },
  green: {
    bg: "bg-[#EBFAF9]",
    text: "text-[#1C6E67]",
    badge: "bg-[#2AA79C]",
  },
};

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#FFFCF5]">
      {/* Header with Maude mascot */}
      <div className="text-center mb-10">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/maude.png"
            alt="Maude — HeyMo AI health agent"
            width={120}
            height={120}
            className="mb-3 drop-shadow-lg"
            priority
          />
          <h1 className="text-4xl font-bold text-[#282830] tracking-tight">
            Hey<span className="text-[#5C59F3]">Mo</span>
          </h1>
          <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-widest mt-1">by alan</p>
        </div>
        <p className="text-lg text-[#464754] max-w-xl">
          AI-powered voice follow-up for health members.
          <br />
          <span className="text-[#9DA3BA]">Select a patient profile to start a care call.</span>
        </p>
      </div>

      {/* Patient cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {PATIENTS.map((patient) => {
          const colors = planColors[patient.color] || planColors.blue;
          return (
            <button
              key={patient.id}
              onClick={() => onSelect(patient)}
              className="alan-card text-left p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-200"
            >
              {/* Card header with plan color */}
              <div className={`${colors.bg} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{patient.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#282830]">{patient.name}</h2>
                    <p className="text-sm text-[#464754]">{patient.age} years old</p>
                  </div>
                </div>
                <span className={`${colors.badge} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                  {patient.plan}
                </span>
              </div>

              {/* Card body */}
              <div className="px-6 py-5">
                <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-1">
                  {patient.eventType}
                </p>
                <p className="text-[#282830] font-medium mb-1">{patient.eventDescription}</p>
                <p className="text-sm text-[#9DA3BA] mb-5">{patient.eventDate}</p>

                <div className="alan-btn-primary py-3 text-center flex items-center justify-center gap-2">
                  <PhoneIcon size={16} color="white" />
                  Start Call
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-12 text-[#9DA3BA] text-sm">
        <span>Powered by</span>
        <span className="font-semibold text-[#464754]">Mistral</span>
        <span>·</span>
        <span className="font-semibold text-[#464754]">Linkup</span>
        <span>·</span>
        <span className="font-semibold text-[#464754]">Thryve</span>
        <span>·</span>
        <span className="font-semibold text-[#464754]">LiveKit</span>
      </div>
    </div>
  );
}
