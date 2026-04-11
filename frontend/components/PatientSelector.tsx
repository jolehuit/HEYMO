/**
 * Patient selector — landing page
 *
 * Owner: Dev 3
 */

"use client";

import Image from "next/image";
import { PATIENTS, PatientProfile } from "@/lib/patients";
import { useTranslation } from "@/lib/i18n";
import { PhoneIcon } from "./AlanIcons";
import LanguageSelector from "./LanguageSelector";

interface PatientSelectorProps {
  onSelect: (patient: PatientProfile) => void;
}

const planColors: Record<string, { bg: string; badge: string }> = {
  blue: { bg: "bg-[#F0F3FF]", badge: "bg-[#5C59F3]" },
  green: { bg: "bg-[#EBFAF9]", badge: "bg-[#2AA79C]" },
};

export default function PatientSelector({ onSelect }: PatientSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#FFFCF5] relative">
      {/* Language selector top-right */}
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

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
          {t("landing.subtitle")}
          <br />
          <span className="text-[#9DA3BA]">{t("landing.cta_hint")}</span>
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
              <div className={`${colors.bg} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{patient.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#282830]">{patient.name}</h2>
                    <p className="text-sm text-[#464754]">{patient.age} {t("landing.years_old")}</p>
                  </div>
                </div>
                <span className={`${colors.badge} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                  {patient.plan}
                </span>
              </div>

              <div className="px-6 py-5">
                <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-1">
                  {t(`event.${patient.eventType}` as never) || patient.eventType}
                </p>
                <p className="text-[#282830] font-medium mb-1">{t(`desc.${patient.eventDescription}` as never) || patient.eventDescription}</p>
                <p className="text-sm text-[#9DA3BA] mb-5">{patient.eventDate}</p>

                <div className="alan-btn-primary py-3 text-center flex items-center justify-center gap-2">
                  <PhoneIcon size={16} color="white" />
                  {t("landing.start_call")}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-12 text-[#9DA3BA] text-sm">
        <span>{t("landing.powered_by")}</span>
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
