/**
 * Language selector — FR / EN toggle
 *
 * Owner: Dev 3
 */

"use client";

import { useTranslation, Locale } from "@/lib/i18n";

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  const options: { value: Locale; flag: string; label: string }[] = [
    { value: "fr", flag: "🇫🇷", label: "FR" },
    { value: "en", flag: "🇬🇧", label: "EN" },
  ];

  return (
    <div className={`flex items-center gap-1 bg-[#F0F3FF] rounded-full p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            locale === opt.value
              ? "bg-white text-[#282830] shadow-sm"
              : "text-[#9DA3BA] hover:text-[#464754]"
          }`}
        >
          <span>{opt.flag}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
